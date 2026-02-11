/**
 * ACO Dashboard - Static Data Fetching
 *
 * These functions are called at build time to fetch data from Snowflake.
 * Data is then baked into static pages served from Vercel's CDN.
 *
 * Rebuild schedule: Daily at 6 AM UTC via GitHub Actions
 */

import { getSnowflakeConfig, querySnowflake } from '@/lib/snowflake';

export interface DashboardSummary {
  TOTAL_ACOS: number;
  ACOS_WITH_SAVINGS: number;
  ACOS_WITH_LOSSES: number;
  TOTAL_BENEFICIARIES: number;
  TOTAL_BENCHMARK_EXPENDITURE: number;
  TOTAL_ACTUAL_EXPENDITURE: number;
  TOTAL_SAVINGS_LOSSES: number;
  AVG_SAVINGS_RATE_PCT: number;
  AVG_QUALITY_SCORE: number;
}

export interface ACORanking {
  ACO_ID: string;
  ACO_NAME: string;
  ACO_STATE: string;
  ACO_TRACK: string;
  TOTAL_BENEFICIARIES: number;
  SAVINGS_RATE_PCT: number;
  QUALITY_SCORE: number;
  SAVINGS_RATE_RANK: number;
  PERFORMANCE_CATEGORY: string;
}

/**
 * Fetch dashboard summary KPIs
 * Returns a single row with aggregate statistics
 */
export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const startTime = Date.now();
  console.log('[BUILD] Fetching dashboard summary...');

  const config = getSnowflakeConfig();
  const sql = `
    SELECT
      TOTAL_ACOS,
      ACOS_WITH_SAVINGS,
      ACOS_WITH_LOSSES,
      TOTAL_BENEFICIARIES,
      TOTAL_BENCHMARK_EXPENDITURE,
      TOTAL_ACTUAL_EXPENDITURE,
      TOTAL_SAVINGS_LOSSES,
      AVG_SAVINGS_RATE_PCT,
      AVG_QUALITY_SCORE
    FROM DASHBOARD_SUMMARY
    LIMIT 1
  `;

  const data = await querySnowflake<DashboardSummary>(sql, config);
  const elapsed = Date.now() - startTime;

  console.log(`[BUILD] ✓ Dashboard summary fetched: 1 row in ${elapsed}ms`);

  return data[0] || {} as DashboardSummary;
}

/**
 * Fetch ACO rankings
 * Returns top 100 ACOs for client-side filtering/sorting
 */
export async function fetchACORankings(): Promise<ACORanking[]> {
  const startTime = Date.now();
  console.log('[BUILD] Fetching ACO rankings...');

  const config = getSnowflakeConfig();
  const sql = `
    SELECT
      ACO_ID,
      ACO_NAME,
      ACO_STATE,
      ACO_TRACK,
      TOTAL_BENEFICIARIES,
      SAVINGS_RATE_PCT,
      QUALITY_SCORE,
      SAVINGS_RATE_RANK,
      PERFORMANCE_CATEGORY
    FROM DASHBOARD_ACO_RANKINGS
    ORDER BY SAVINGS_RATE_RANK
    LIMIT 100
  `;

  const data = await querySnowflake<ACORanking>(sql, config);
  const elapsed = Date.now() - startTime;

  console.log(`[BUILD] ✓ ACO rankings fetched: ${data.length} rows in ${elapsed}ms`);

  return data;
}

/**
 * Fetch all ACO dashboard data in one call
 * Called once at build time
 */
export async function fetchACODashboardData() {
  const startTime = Date.now();
  console.log('[BUILD] ===== Fetching ACO Dashboard Data =====');

  const [summary, rankings] = await Promise.all([
    fetchDashboardSummary(),
    fetchACORankings(),
  ]);

  const elapsed = Date.now() - startTime;
  const totalRows = rankings.length + 1;

  console.log(`[BUILD] ✓ ACO dashboard data complete: ${totalRows} rows in ${elapsed}ms`);
  console.log(`[BUILD] Data timestamp: ${new Date().toISOString()}`);

  return {
    summary,
    rankings,
    buildTimestamp: new Date().toISOString(),
  };
}
