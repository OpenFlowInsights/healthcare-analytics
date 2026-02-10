import snowflake from 'snowflake-sdk';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env.local') });

interface SnowflakeRow {
  [key: string]: any;
}

async function executeSql(connection: snowflake.Connection, sqlText: string): Promise<SnowflakeRow[]> {
  return new Promise((resolve, reject) => {
    connection.execute({
      sqlText,
      complete: (err, stmt, rows) => {
        if (err) {
          console.error('Failed to execute statement:', err);
          reject(err);
        } else {
          resolve(rows || []);
        }
      }
    });
  });
}

async function analyzeNDCMatching() {
  const connection = snowflake.createConnection({
    account: process.env.SNOWFLAKE_ACCOUNT!,
    username: process.env.SNOWFLAKE_USERNAME!,
    password: process.env.SNOWFLAKE_PASSWORD!,
    warehouse: process.env.SNOWFLAKE_WAREHOUSE!,
    database: process.env.SNOWFLAKE_DATABASE!,
    role: 'ACCOUNTADMIN',
  });

  await new Promise<void>((resolve, reject) => {
    connection.connect((err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });

  try {
    console.log('NDC Matching Analysis');
    console.log('====================\n');

    // Use the dbt staging view which has normalized NDCs
    console.log('Checking match rate using dbt staging view (with normalized NDCs):\n');

    const matchRate = await executeSql(connection, `
      WITH claims_ndcs AS (
        SELECT DISTINCT
          ndc as ndc_original,
          LPAD(ndc, 11, '0') as ndc_normalized
        FROM raw_claims.rx_claims
        WHERE ndc IS NOT NULL
      ),
      rxnorm_ndcs AS (
        SELECT DISTINCT ndc_normalized, rxcui
        FROM dev_db.staging_staging.stg_rxnorm__ndc_mappings
      )
      SELECT
        COUNT(DISTINCT c.ndc_original) as total_claim_ndcs,
        COUNT(DISTINCT CASE WHEN r.ndc_normalized IS NOT NULL THEN c.ndc_original END) as matched_ndcs,
        ROUND(100.0 * COUNT(DISTINCT CASE WHEN r.ndc_normalized IS NOT NULL THEN c.ndc_original END) /
              NULLIF(COUNT(DISTINCT c.ndc_original), 0), 2) as match_rate_pct
      FROM claims_ndcs c
      LEFT JOIN rxnorm_ndcs r ON c.ndc_normalized = r.ndc_normalized
    `);

    console.log('Overall NDC match rate:');
    console.log(`  Total claim NDCs: ${matchRate[0].TOTAL_CLAIM_NDCS.toLocaleString()}`);
    console.log(`  Matched in RxNorm: ${matchRate[0].MATCHED_NDCS.toLocaleString()}`);
    console.log(`  Match rate: ${matchRate[0].MATCH_RATE_PCT}%`);

    // Spot check: sample matched and unmatched NDCs
    console.log('\n\nSpot check - Sample matched NDCs:');
    const matchedSamples = await executeSql(connection, `
      WITH claims_ndcs AS (
        SELECT DISTINCT
          ndc as ndc_original,
          LPAD(ndc, 11, '0') as ndc_normalized
        FROM raw_claims.rx_claims
        WHERE ndc IS NOT NULL
      )
      SELECT
        c.ndc_original as claim_ndc,
        r.ndc_normalized as rxnorm_ndc_normalized,
        r.ndc_raw as rxnorm_ndc_raw,
        r.rxcui,
        rc.concept_name as drug_name
      FROM claims_ndcs c
      INNER JOIN dev_db.staging_staging.stg_rxnorm__ndc_mappings r
        ON c.ndc_normalized = r.ndc_normalized
      LEFT JOIN dev_db.staging_staging.stg_rxnorm__concepts rc
        ON r.rxcui = rc.rxcui
      LIMIT 10
    `);
    console.table(matchedSamples);

    console.log('\n\nSpot check - Sample unmatched NDCs:');
    const unmatchedSamples = await executeSql(connection, `
      WITH claims_ndcs AS (
        SELECT DISTINCT
          c.ndc as ndc_original,
          c.bn as drug_name,
          LPAD(c.ndc, 11, '0') as ndc_normalized
        FROM raw_claims.rx_claims c
        WHERE c.ndc IS NOT NULL
      )
      SELECT
        c.ndc_original as claim_ndc,
        c.drug_name as claim_drug_name,
        c.ndc_normalized
      FROM claims_ndcs c
      LEFT JOIN dev_db.staging_staging.stg_rxnorm__ndc_mappings r
        ON c.ndc_normalized = r.ndc_normalized
      WHERE r.ndc_normalized IS NULL
      LIMIT 10
    `);
    console.table(unmatchedSamples);

    // Top drugs by claim count
    console.log('\n\nTop 10 drugs by claim count (with RxNorm match status):');
    const topDrugs = await executeSql(connection, `
      WITH claim_summary AS (
        SELECT
          ndc,
          bn as drug_name,
          COUNT(*) as claim_count,
          SUM(TRY_CAST(PrescriptionCost AS DECIMAL(18,2))) as total_cost
        FROM raw_claims.rx_claims
        WHERE ndc IS NOT NULL
        GROUP BY ndc, bn
      )
      SELECT
        c.drug_name,
        c.ndc,
        c.claim_count,
        c.total_cost,
        CASE WHEN r.ndc_normalized IS NOT NULL THEN 'Matched' ELSE 'Unmatched' END as rxnorm_status,
        r.rxcui
      FROM claim_summary c
      LEFT JOIN dev_db.staging_staging.stg_rxnorm__ndc_mappings r
        ON LPAD(c.ndc, 11, '0') = r.ndc_normalized
      ORDER BY c.claim_count DESC
      LIMIT 10
    `);
    console.table(topDrugs);

  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    await new Promise<void>((resolve) => {
      connection.destroy((err) => {
        if (err) {
          console.error('Error closing connection:', err);
        }
        resolve();
      });
    });
  }
}

analyzeNDCMatching()
  .then(() => {
    console.log('\n✓ Analysis complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
