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
 * Fetch quarterly spending trends
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
 * Fetch top drug spending drivers
 * Returns top 100 unique drugs aggregated across all quarters
 * Fixed: Removes duplicate drugs by aggregating spending
 */
export async function fetchDrugDrivers(): Promise<DrugDriver[]> {
  const startTime = Date.now();
  console.log('[BUILD] Fetching drug drivers...');

  const config = getSnowflakeConfig();
  const sql = `
    SELECT
      BRAND_NAME,
      GENERIC_NAME,
      PROGRAM,
      MAX("YEAR") as YEAR,
      MAX(QUARTER) as QUARTER,
      SUM(TOTAL_SPENDING) as TOTAL_SPENDING,
      SUM(TOTAL_CLAIMS) as TOTAL_CLAIMS,
      SUM(TOTAL_BENEFICIARIES) as TOTAL_BENEFICIARIES,
      AVG(AVG_SPENDING_PER_CLAIM) as AVG_SPENDING_PER_CLAIM,
      AVG(AVG_SPENDING_PER_BENEFICIARY) as AVG_SPENDING_PER_BENEFICIARY,
      AVG(QOQ_GROWTH_PCT) as QOQ_GROWTH_PCT,
      MAX(PCT_OF_TOTAL_SPEND) as PCT_OF_TOTAL_SPEND,
      SUM(SPENDING_CHANGE_DOLLARS) as SPENDING_CHANGE_DOLLARS,
      MIN(SPEND_RANK) as SPEND_RANK
    FROM STAGING_analytics.DRUG_SPEND_TOP_DRIVERS
    GROUP BY BRAND_NAME, GENERIC_NAME, PROGRAM
    ORDER BY TOTAL_SPENDING DESC
    LIMIT 100
  `;

  const data = await querySnowflake<DrugDriver>(sql, config);
  const elapsed = Date.now() - startTime;

  console.log(`[BUILD] ✓ Drug drivers fetched: ${data.length} unique drugs in ${elapsed}ms`);

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

  const [summary, trend, drivers, categories] = await Promise.all([
    fetchDrugSpendSummary(),
    fetchDrugSpendTrend(),
    fetchDrugDrivers(),
    fetchDrugCategories(),
  ]);

  const elapsed = Date.now() - startTime;
  const totalRows = 1 + trend.length + drivers.length + categories.length;

  console.log(`[BUILD] ✓ Drug spending dashboard data complete: ${totalRows} rows in ${elapsed}ms`);
  console.log(`[BUILD] Data timestamp: ${new Date().toISOString()}`);

  return {
    summary,
    trend,
    drivers,
    categories,
    buildTimestamp: new Date().toISOString(),
  };
}
