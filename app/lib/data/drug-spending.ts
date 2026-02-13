/**
 * Drug Spending Dashboard - Static Data Fetching
 *
 * These functions are called at build time to fetch data from Snowflake.
 * Data is then baked into static pages served from Vercel's CDN.
 *
 * Rebuild schedule: Daily at 6 AM UTC via GitHub Actions
 */

import { getSnowflakeConfig, querySnowflake } from '@/lib/snowflake';

export interface DrugSpendSummary {
  YEAR: number;
  QUARTER: number;
  PERIOD: string;
  PARTD_SPENDING: number;
  PARTD_CLAIMS: number;
  PARTD_BENEFICIARIES: number;
  PARTD_UNIQUE_DRUGS: number;
  PARTB_SPENDING: number;
  PARTB_CLAIMS: number;
  PARTB_BENEFICIARIES: number;
  PARTB_UNIQUE_DRUGS: number;
  COMBINED_TOTAL_SPENDING: number;
  COMBINED_TOTAL_CLAIMS: number;
  COMBINED_TOTAL_BENEFICIARIES: number;
  COMBINED_UNIQUE_DRUGS: number;
  PARTD_QOQ_CHANGE_PCT: number;
  PARTB_QOQ_CHANGE_PCT: number;
  COMBINED_QOQ_CHANGE_PCT: number;
  TOP_DRUG_BRAND: string;
  TOP_DRUG_GENERIC: string;
  TOP_DRUG_SPENDING: number;
  TOP_DRUG_PROGRAM: string;
}

export interface DrugSpendTrend {
  YEAR: number;
  QUARTER: number;
  PERIOD: string;
  PROGRAM: string;
  TOTAL_SPENDING: number;
  TOTAL_CLAIMS: number;
  TOTAL_BENEFICIARIES: number;
  AVG_COST_PER_CLAIM: number;
  AVG_COST_PER_BENEFICIARY: number;
  QOQ_CHANGE_PCT: number;
  YOY_CHANGE_PCT: number;
  ROLLING_AVG_4Q: number;
}

export interface DrugDriver {
  BRAND_NAME: string;
  GENERIC_NAME: string;
  PROGRAM: string;
  YEAR: number;
  QUARTER: number;
  TOTAL_SPENDING: number;
  TOTAL_CLAIMS: number;
  TOTAL_BENEFICIARIES: number;
  AVG_SPENDING_PER_CLAIM: number;
  AVG_SPENDING_PER_BENEFICIARY: number;
  QOQ_GROWTH_PCT: number;
  PCT_OF_TOTAL_SPEND: number;
  SPENDING_CHANGE_DOLLARS: number;
  SPEND_RANK: number;
}

export interface DrugCategory {
  YEAR: number;
  QUARTER: number;
  PERIOD: string;
  PROGRAM: string;
  CATEGORY: string;
  DRUG_COUNT: number;
  TOTAL_SPENDING: number;
  TOTAL_CLAIMS: number;
  TOTAL_BENEFICIARIES: number;
  AVG_SPENDING_PER_DRUG: number;
  AVG_COST_PER_CLAIM: number;
  PCT_OF_PROGRAM_SPEND: number;
  CATEGORY_RANK: number;
}

/**
 * Fetch drug spending summary KPIs
 * Returns a single row with latest quarter metrics
 */
export async function fetchDrugSpendSummary(): Promise<DrugSpendSummary> {
  const startTime = Date.now();
  console.log('[BUILD] Fetching drug spending summary...');

  const config = getSnowflakeConfig();
  const sql = `
    SELECT
      YEAR,
      QUARTER,
      PERIOD,
      PARTD_SPENDING,
      PARTD_CLAIMS,
      PARTD_BENEFICIARIES,
      PARTD_UNIQUE_DRUGS,
      PARTB_SPENDING,
      PARTB_CLAIMS,
      PARTB_BENEFICIARIES,
      PARTB_UNIQUE_DRUGS,
      COMBINED_TOTAL_SPENDING,
      COMBINED_TOTAL_CLAIMS,
      COMBINED_TOTAL_BENEFICIARIES,
      COMBINED_UNIQUE_DRUGS,
      PARTD_QOQ_CHANGE_PCT,
      PARTB_QOQ_CHANGE_PCT,
      COMBINED_QOQ_CHANGE_PCT,
      TOP_DRUG_BRAND,
      TOP_DRUG_GENERIC,
      TOP_DRUG_SPENDING,
      TOP_DRUG_PROGRAM
    FROM STAGING_analytics.DRUG_SPEND_SUMMARY_KPIS
    LIMIT 1
  `;

  const data = await querySnowflake<DrugSpendSummary>(sql, config);
  const elapsed = Date.now() - startTime;

  console.log(`[BUILD] ✓ Drug spending summary fetched: 1 row in ${elapsed}ms`);

  return data[0] || {} as DrugSpendSummary;
}

/**
 * Fetch year-over-year spending comparison
 * Returns 2024 (full year) vs 2025 (Q1-Q2) with annualized projections
 */
export interface YearComparisonData {
  year: string;
  program: string;
  actual_spending: number;
  actual_claims: number;
  periods_included: string;
  annualized_spending?: number;
}

export async function fetchYearComparison(): Promise<YearComparisonData[]> {
  const startTime = Date.now();
  console.log('[BUILD] Fetching year-over-year comparison...');

  try {
    const config = getSnowflakeConfig();
    const sql = `
      SELECT
        "Year" as year,
        'Part D' as program,
        SUM("Tot_Spndng") as actual_spending,
        SUM("Tot_Clms") as actual_claims,
        "Year" as periods_included
      FROM RAW.RAW_PARTD_SPENDING_QUARTERLY
      WHERE "Year" IN ('2024 (Q1-Q4)', '2025 (Q1-Q2)')
      GROUP BY "Year"

      UNION ALL

      SELECT
        "Year" as year,
        'Part B' as program,
        SUM("Tot_Spndng") as actual_spending,
        SUM("Tot_Clms") as actual_claims,
        "Year" as periods_included
      FROM RAW.RAW_PARTB_SPENDING_QUARTERLY
      WHERE "Year" IN ('2024 (Q1-Q4)', '2025 (Q1-Q2)')
      GROUP BY "Year"

      ORDER BY year DESC, program
    `;

    const data = await querySnowflake<YearComparisonData>(sql, config);

    // Calculate annualized projections for 2025 (Q1-Q2 represents 2 quarters, so multiply by 2)
    const processedData = data.map(row => ({
      ...row,
      year: row.year || '',
      annualized_spending: row.year?.includes('2025') ? row.actual_spending * 2 : row.actual_spending,
    }));

    const elapsed = Date.now() - startTime;
    console.log(`[BUILD] ✓ Year comparison fetched: ${processedData.length} rows in ${elapsed}ms`);

    return processedData;
  } catch (error) {
    console.error('[BUILD] ✗ Year comparison fetch failed:', error);
    // Return empty array if query fails
    return [];
  }
}

/**
 * Fetch quarterly spending trends (kept for compatibility)
 * Returns all available quarters for both Part D and Part B
 */
export async function fetchDrugSpendTrend(): Promise<DrugSpendTrend[]> {
  const startTime = Date.now();
  console.log('[BUILD] Fetching drug spending trend...');

  const config = getSnowflakeConfig();
  const sql = `
    SELECT
      YEAR,
      QUARTER,
      PERIOD,
      PROGRAM,
      TOTAL_SPENDING,
      TOTAL_CLAIMS,
      TOTAL_BENEFICIARIES,
      AVG_COST_PER_CLAIM,
      AVG_COST_PER_BENEFICIARY,
      QOQ_CHANGE_PCT,
      YOY_CHANGE_PCT,
      ROLLING_AVG_4Q
    FROM STAGING_analytics.DRUG_SPEND_QUARTERLY_TREND
    ORDER BY YEAR DESC, QUARTER DESC, PROGRAM
    LIMIT 100
  `;

  const data = await querySnowflake<DrugSpendTrend>(sql, config);
  const elapsed = Date.now() - startTime;

  console.log(`[BUILD] ✓ Drug spending trend fetched: ${data.length} rows in ${elapsed}ms`);

  return data;
}

/**
 * Fetch top drug spending drivers with 2024 vs 2025 comparison
 * Returns top 100 unique drugs with side-by-side year comparison
 */
export interface DrugDriverComparison extends DrugDriver {
  SPENDING_2024?: number;
  CLAIMS_2024?: number;
  BENES_2024?: number;
  AVG_COST_CLAIM_2024?: number;
  SPENDING_2025_ACTUAL?: number;
  CLAIMS_2025_ACTUAL?: number;
  BENES_2025_ACTUAL?: number;
  AVG_COST_CLAIM_2025?: number;
  SPENDING_2025_ANNUALIZED?: number;
  CLAIMS_2025_ANNUALIZED?: number;
  BENES_2025_ANNUALIZED?: number;
}

export async function fetchDrugDrivers(): Promise<DrugDriverComparison[]> {
  const startTime = Date.now();
  console.log('[BUILD] Fetching drug drivers with year comparison...');

  const config = getSnowflakeConfig();
  const sql = `
    WITH drug_2024 AS (
      SELECT
        "Brnd_Name" as BRAND_NAME,
        "Gnrc_Name" as GENERIC_NAME,
        SUM("Tot_Spndng") as SPENDING_2024,
        SUM("Tot_Clms") as CLAIMS_2024,
        SUM("Tot_Benes") as BENES_2024,
        AVG("Avg_Spnd_Per_Clm") as AVG_COST_CLAIM_2024
      FROM RAW.RAW_PARTD_SPENDING_QUARTERLY
      WHERE "Year" = '2024 (Q1-Q4)'
      GROUP BY "Brnd_Name", "Gnrc_Name"
    ),
    drug_2025 AS (
      SELECT
        "Brnd_Name" as BRAND_NAME,
        "Gnrc_Name" as GENERIC_NAME,
        SUM("Tot_Spndng") as SPENDING_2025_ACTUAL,
        SUM("Tot_Clms") as CLAIMS_2025_ACTUAL,
        SUM("Tot_Benes") as BENES_2025_ACTUAL,
        AVG("Avg_Spnd_Per_Clm") as AVG_COST_CLAIM_2025
      FROM RAW.RAW_PARTD_SPENDING_QUARTERLY
      WHERE "Year" = '2025 (Q1-Q2)'
      GROUP BY "Brnd_Name", "Gnrc_Name"
    )
    SELECT
      COALESCE(d24.BRAND_NAME, d25.BRAND_NAME) as BRAND_NAME,
      COALESCE(d24.GENERIC_NAME, d25.GENERIC_NAME) as GENERIC_NAME,
      'Part D' as PROGRAM,
      2025 as YEAR,
      'Q1-Q2' as QUARTER,
      COALESCE(d24.SPENDING_2024, 0) + COALESCE(d25.SPENDING_2025_ACTUAL, 0) as TOTAL_SPENDING,
      COALESCE(d24.CLAIMS_2024, 0) + COALESCE(d25.CLAIMS_2025_ACTUAL, 0) as TOTAL_CLAIMS,
      COALESCE(d24.BENES_2024, 0) + COALESCE(d25.BENES_2025_ACTUAL, 0) as TOTAL_BENEFICIARIES,
      COALESCE(d24.AVG_COST_CLAIM_2024, d25.AVG_COST_CLAIM_2025, 0) as AVG_SPENDING_PER_CLAIM,
      0 as AVG_SPENDING_PER_BENEFICIARY,
      0 as QOQ_GROWTH_PCT,
      0 as PCT_OF_TOTAL_SPEND,
      0 as SPENDING_CHANGE_DOLLARS,
      0 as SPEND_RANK,
      d24.SPENDING_2024,
      d24.CLAIMS_2024,
      d24.BENES_2024,
      d24.AVG_COST_CLAIM_2024,
      d25.SPENDING_2025_ACTUAL,
      d25.CLAIMS_2025_ACTUAL,
      d25.BENES_2025_ACTUAL,
      d25.AVG_COST_CLAIM_2025,
      d25.SPENDING_2025_ACTUAL * 2 as SPENDING_2025_ANNUALIZED,
      d25.CLAIMS_2025_ACTUAL * 2 as CLAIMS_2025_ANNUALIZED,
      d25.BENES_2025_ACTUAL * 2 as BENES_2025_ANNUALIZED
    FROM drug_2024 d24
    FULL OUTER JOIN drug_2025 d25
      ON d24.BRAND_NAME = d25.BRAND_NAME
      AND d24.GENERIC_NAME = d25.GENERIC_NAME
    ORDER BY COALESCE(d24.SPENDING_2024, 0) + COALESCE(d25.SPENDING_2025_ACTUAL * 2, 0) DESC
    LIMIT 100
  `;

  const data = await querySnowflake<DrugDriverComparison>(sql, config);
  const elapsed = Date.now() - startTime;

  console.log(`[BUILD] ✓ Drug drivers fetched: ${data.length} unique drugs with year comparison in ${elapsed}ms`);

  return data;
}

/**
 * Fetch drug spending by category
 * Returns top 20 categories across last 8 quarters
 */
export async function fetchDrugCategories(): Promise<DrugCategory[]> {
  const startTime = Date.now();
  console.log('[BUILD] Fetching drug categories...');

  const config = getSnowflakeConfig();
  const sql = `
    SELECT
      YEAR,
      QUARTER,
      PERIOD,
      PROGRAM,
      CATEGORY,
      DRUG_COUNT,
      TOTAL_SPENDING,
      TOTAL_CLAIMS,
      TOTAL_BENEFICIARIES,
      AVG_SPENDING_PER_DRUG,
      AVG_COST_PER_CLAIM,
      PCT_OF_PROGRAM_SPEND,
      CATEGORY_RANK
    FROM STAGING_analytics.DRUG_SPEND_BY_CATEGORY
    WHERE CATEGORY_RANK <= 20
    ORDER BY YEAR DESC, QUARTER DESC, PROGRAM, CATEGORY_RANK
    LIMIT 200
  `;

  const data = await querySnowflake<DrugCategory>(sql, config);
  const elapsed = Date.now() - startTime;

  console.log(`[BUILD] ✓ Drug categories fetched: ${data.length} rows in ${elapsed}ms`);

  return data;
}

/**
 * Fetch all drug spending dashboard data in one call
 * Called once at build time
 */
export async function fetchDrugSpendingDashboardData() {
  const startTime = Date.now();
  console.log('[BUILD] ===== Fetching Drug Spending Dashboard Data =====');

  const [summary, trend, drivers, categories, yearComparison] = await Promise.all([
    fetchDrugSpendSummary(),
    fetchDrugSpendTrend(),
    fetchDrugDrivers(),
    fetchDrugCategories(),
    fetchYearComparison(),
  ]);

  const elapsed = Date.now() - startTime;
  const totalRows = 1 + trend.length + drivers.length + categories.length + yearComparison.length;

  console.log(`[BUILD] ✓ Drug spending dashboard data complete: ${totalRows} rows in ${elapsed}ms`);
  console.log(`[BUILD] Data timestamp: ${new Date().toISOString()}`);

  return {
    summary,
    trend,
    drivers,
    categories,
    yearComparison,
    buildTimestamp: new Date().toISOString(),
  };
}
