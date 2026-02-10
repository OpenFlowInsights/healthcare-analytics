import snowflake from 'snowflake-sdk';

const connection = snowflake.createConnection({
  account: process.env.SNOWFLAKE_ACCOUNT!,
  username: process.env.SNOWFLAKE_USER!,
  password: process.env.SNOWFLAKE_PASSWORD!,
  database: 'DEV_DB',
  warehouse: 'DEV_WH',
  role: 'ACCOUNTADMIN',
});

async function executeQuery(sql: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    connection.execute({
      sqlText: sql,
      complete: (err, stmt, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      },
    });
  });
}

async function main() {
  await new Promise((resolve, reject) => {
    connection.connect((err) => (err ? reject(err) : resolve(null)));
  });

  console.log('✓ Connected to Snowflake\n');

  // Step 1: Rebuild int_claims_with_rxcui using drug name matching
  console.log('Step 1: Rebuilding int_claims_with_rxcui with drug name matching...');

  await executeQuery('CREATE OR REPLACE TABLE STAGING_intermediate.int_claims_with_rxcui AS ' +
    `WITH claims AS (
      SELECT * FROM STAGING.stg_claims__rx_claims
    ),
    rxnorm_bn AS (
      SELECT DISTINCT LOWER(TRIM(STR)) as name_lower, RXCUI, STR as drug_name FROM raw_rxnorm.rxnconso
      WHERE TTY = 'BN' AND SAB = 'RXNORM'
    ),
    rxnorm_in AS (
      SELECT DISTINCT LOWER(TRIM(STR)) as name_lower, RXCUI, STR as drug_name FROM raw_rxnorm.rxnconso
      WHERE TTY = 'IN' AND SAB = 'RXNORM'
    ),
    claims_enriched AS (
      SELECT
        c.*,
        COALESCE(bn.RXCUI, ing.RXCUI) as rxcui,
        COALESCE(bn.drug_name, ing.drug_name, c.brand_name) as drug_name,
        CASE
          WHEN bn.RXCUI IS NOT NULL THEN 'brand_name_exact'
          WHEN ing.RXCUI IS NOT NULL THEN 'ingredient_exact'
          ELSE 'unmatched'
        END as match_method,
        CASE WHEN COALESCE(bn.RXCUI, ing.RXCUI) IS NOT NULL THEN TRUE ELSE FALSE END as has_rxcui_match
      FROM claims c
      LEFT JOIN rxnorm_bn bn ON LOWER(TRIM(c.brand_name)) = bn.name_lower
      LEFT JOIN rxnorm_in ing ON LOWER(TRIM(c.brand_name)) = ing.name_lower
    )
    SELECT * FROM claims_enriched`
  );

  const matchStats = await executeQuery(
    `SELECT match_method, COUNT(*) as cnt, SUM(amount_paid) as total_paid
     FROM STAGING_intermediate.int_claims_with_rxcui
     GROUP BY match_method ORDER BY cnt DESC`
  );

  console.log('\n Match Statistics:');
  matchStats.forEach((row: any) => {
    console.log(`   ${row.MATCH_METHOD}: ${row.CNT.toLocaleString()} claims ($${(row.TOTAL_PAID || 0).toLocaleString()})`);
  });

  const totalClaims = await executeQuery('SELECT COUNT(*) as total FROM STAGING_intermediate.int_claims_with_rxcui');
  const matchedClaims = await executeQuery('SELECT COUNT(*) as matched FROM STAGING_intermediate.int_claims_with_rxcui WHERE has_rxcui_match = TRUE');
  const matchRate = (matchedClaims[0].MATCHED / totalClaims[0].TOTAL * 100).toFixed(2);
  console.log(`\n   Overall Match Rate: ${matchRate}%\n`);

  // Step 2: Rebuild int_claims_pa_exposure
  console.log('Step 2: Rebuilding int_claims_pa_exposure...');
  await executeQuery('CREATE OR REPLACE TABLE STAGING_intermediate.int_claims_pa_exposure AS ' +
    `WITH claims_with_rxcui AS (
      SELECT * FROM STAGING_intermediate.int_claims_with_rxcui WHERE has_rxcui_match = TRUE
    ),
    pa_summary AS (
      SELECT rxcui, pct_plans_with_pa, total_plans, most_common_tier
      FROM STAGING_marts.mart_prior_auth_summary
    ),
    claims_pa AS (
      SELECT
        c.rxcui,
        c.drug_name,
        c.brand_name,
        c.therapeutic_class_gtc,
        c.therapeutic_class_etc,
        c.pharmacy_class,
        COUNT(*) as claim_count,
        SUM(c.amount_paid) as total_paid,
        SUM(c.prescription_cost) as total_prescription_cost,
        AVG(c.amount_paid) as avg_cost_per_claim,
        SUM(c.days_supply) as total_days_supply,
        SUM(c.unit_count) as total_units,
        COUNT(DISTINCT c.prescriber_npi) as unique_prescribers,
        COALESCE(p.pct_plans_with_pa, 0) as pct_mapd_plans_requiring_pa,
        COALESCE(p.total_plans, 0) as national_plans_offering,
        p.most_common_tier as national_most_common_tier
      FROM claims_with_rxcui c
      LEFT JOIN pa_summary p ON c.rxcui = p.rxcui
      GROUP BY c.rxcui, c.drug_name, c.brand_name, c.therapeutic_class_gtc, c.therapeutic_class_etc,
               c.pharmacy_class, p.pct_plans_with_pa, p.total_plans, p.most_common_tier
    )
    SELECT * FROM claims_pa`
  );

  const paCount = await executeQuery('SELECT COUNT(*) as cnt FROM STAGING_intermediate.int_claims_pa_exposure');
  console.log(`   Created ${paCount[0].CNT.toLocaleString()} drug-level PA exposure records\n`);

  // Step 3: Rebuild mart_claims_pa_opportunity
  console.log('Step 3: Rebuilding mart_claims_pa_opportunity...');
  await executeQuery('CREATE OR REPLACE TABLE STAGING_marts.mart_claims_pa_opportunity AS ' +
    `WITH pa_exposure AS (
      SELECT * FROM STAGING_intermediate.int_claims_pa_exposure
    ),
    opportunity_calc AS (
      SELECT
        rxcui,
        drug_name,
        brand_name as ndc_normalized,
        brand_name,
        therapeutic_class_gtc,
        therapeutic_class_etc,
        pharmacy_class,
        claim_count,
        total_paid,
        total_prescription_cost,
        avg_cost_per_claim,
        total_days_supply,
        total_units,
        unique_prescribers,
        pct_mapd_plans_requiring_pa,
        CASE
          WHEN national_plans_offering > 0 THEN 100.0
          ELSE 0
        END as pct_plans_with_any_um,
        CASE
          WHEN pct_mapd_plans_requiring_pa > 50 THEN 'Very High PA Burden (75%+)'
          WHEN pct_mapd_plans_requiring_pa > 25 THEN 'Elevated PA Burden (50-75%)'
          WHEN pct_mapd_plans_requiring_pa > 0 THEN 'Moderate PA Burden (25-50%)'
          ELSE 'Minimal PA Burden (<25%)'
        END as pa_burden_category,
        national_most_common_tier,
        national_most_common_tier as national_avg_tier,
        national_plans_offering,
        CASE
          WHEN pct_mapd_plans_requiring_pa > 50 THEN 'High'
          WHEN pct_mapd_plans_requiring_pa BETWEEN 25 AND 50 THEN 'Medium'
          WHEN pct_mapd_plans_requiring_pa > 0 THEN 'Low'
          ELSE 'None'
        END as pa_opportunity_tier,
        CASE
          WHEN pct_mapd_plans_requiring_pa > 50 THEN TRUE
          ELSE FALSE
        END as has_high_national_pa_requirement,
        CASE
          WHEN pct_mapd_plans_requiring_pa > 50 THEN total_paid
          ELSE 0
        END as high_opportunity_exposure
      FROM pa_exposure
    ),
    portfolio_totals AS (
      SELECT
        SUM(CASE WHEN pa_opportunity_tier = 'High' THEN total_paid ELSE 0 END) as portfolio_high_exposure,
        SUM(CASE WHEN pa_opportunity_tier = 'Medium' THEN total_paid ELSE 0 END) as portfolio_medium_exposure,
        SUM(CASE WHEN pa_opportunity_tier = 'Low' THEN total_paid ELSE 0 END) as portfolio_low_exposure,
        SUM(total_paid) as portfolio_total_paid
      FROM opportunity_calc
    )
    SELECT
      o.*,
      p.portfolio_high_exposure as portfolio_high_opportunity_exposure,
      p.portfolio_medium_exposure as portfolio_medium_opportunity_exposure,
      p.portfolio_low_exposure as portfolio_low_opportunity_exposure,
      p.portfolio_total_paid,
      (o.total_paid / NULLIF(p.portfolio_total_paid, 0) * 100) as pct_of_portfolio_spend,
      ROW_NUMBER() OVER (PARTITION BY o.pa_opportunity_tier ORDER BY o.total_paid DESC) as rank_within_tier,
      ROW_NUMBER() OVER (ORDER BY o.total_paid DESC) as overall_rank
    FROM opportunity_calc o
    CROSS JOIN portfolio_totals p`
  );

  const oppCount = await executeQuery('SELECT COUNT(*) as cnt, SUM(total_paid) as spend FROM STAGING_marts.mart_claims_pa_opportunity');
  console.log(`   Created ${oppCount[0].CNT.toLocaleString()} opportunity records ($${(oppCount[0].SPEND || 0).toLocaleString()})\n`);

  // Step 4: Get tier breakdown
  const tierBreakdown = await executeQuery(
    `SELECT pa_opportunity_tier, COUNT(*) as drug_count, SUM(total_paid) as total_exposure
     FROM STAGING_marts.mart_claims_pa_opportunity
     GROUP BY pa_opportunity_tier
     ORDER BY CASE pa_opportunity_tier WHEN 'High' THEN 1 WHEN 'Medium' THEN 2 WHEN 'Low' THEN 3 ELSE 4 END`
  );

  console.log('Step 4: PA Opportunity Tier Breakdown:');
  tierBreakdown.forEach((row: any) => {
    console.log(`   ${row.PA_OPPORTUNITY_TIER}: ${row.DRUG_COUNT} drugs, $${(row.TOTAL_EXPOSURE || 0).toLocaleString()} exposure`);
  });

  // Step 5: Top 20 unmatched drugs
  console.log('\nStep 5: Top 20 Unmatched Drugs by Spend:');
  const unmatched = await executeQuery(
    `SELECT brand_name, COUNT(*) as claims, SUM(amount_paid) as total_paid
     FROM STAGING_intermediate.int_claims_with_rxcui
     WHERE has_rxcui_match = FALSE
     GROUP BY brand_name
     ORDER BY total_paid DESC NULLS LAST
     LIMIT 20`
  );

  unmatched.forEach((row: any, i: number) => {
    console.log(`   ${i + 1}. ${row.BRAND_NAME}: ${row.CLAIMS} claims, $${(row.TOTAL_PAID || 0).toFixed(2)}`);
  });

  console.log('\n✓ All models rebuilt successfully!');
  connection.destroy();
}

main().catch(console.error);
