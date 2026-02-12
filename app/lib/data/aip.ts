/**
 * AIP Analysis - Static Data Fetching
 *
 * Fetches ACO Advance Investment Payment (AIP) spending data
 * at build time for static page generation.
 */

import { getSnowflakeConfig, querySnowflake } from '@/lib/snowflake';

// ============================================================================
// TypeScript Interfaces
// ============================================================================

export interface CategorySummary {
  PERFORMANCE_YEAR: number;
  SPENDING_CATEGORY: string;
  NUM_ACOS: number;
  NUM_SUBCATEGORIES: number;
  TOTAL_ACTUAL_SPENDING: number;
  TOTAL_PROJECTED_SPENDING: number;
  AVG_ACTUAL_PER_RECORD: number;
  AVG_PROJECTED_PER_RECORD: number;
  TOTAL_ACOS_IN_YEAR: number;
  YEAR_TOTAL_ACTUAL: number;
  YEAR_TOTAL_PROJECTED: number;
  PCT_OF_YEAR_ACTUAL: number;
  PCT_OF_YEAR_PROJECTED: number;
}

export interface SubcategoryDetail {
  PERFORMANCE_YEAR: number;
  SPENDING_CATEGORY: string;
  SPENDING_SUBCATEGORY: string;
  NUM_ACOS: number;
  TOTAL_ACTUAL_SPENDING: number;
  TOTAL_PROJECTED_SPENDING: number;
  AVG_ACTUAL_PER_ACO: number;
  AVG_PROJECTED_PER_ACO: number;
  MIN_ACTUAL_SPENDING: number;
  MAX_ACTUAL_SPENDING: number;
  AVG_SAVINGS_RATE: number;
  ACOS_WITH_EARNINGS: number;
  ACOS_WITH_LOSSES: number;
}

export interface ACOSpendingDetail {
  PERFORMANCE_YEAR: number;
  ACO_ID: string;
  ACO_NAME: string;
  ACO_TRACK: string;
  ASSIGNED_BENEFICIARIES: number;
  SPENDING_CATEGORY: string;
  SPENDING_SUBCATEGORY: string;
  TOTAL_ACTUAL_SPENDING: number;
  TOTAL_PROJECTED_SPENDING: number;
  ACO_TOTAL_ACTUAL_SPENDING: number;
  ACO_TOTAL_PROJECTED_SPENDING: number;
  PCT_OF_TOTAL_ACTUAL: number;
  PCT_OF_TOTAL_PROJECTED: number;
  GENERATED_SAVINGS_LOSS: number;
  EARNED_SAVINGS_LOSS: number;
  SAVINGS_RATE_PERCENT: number;
  FINANCIAL_OUTCOME: string;
}

export interface ACOProfile {
  PERFORMANCE_YEAR: number;
  ACO_ID: string;
  ACO_NAME: string;
  ACO_TRACK: string;
  ASSIGNED_BENEFICIARIES: number;

  // Financial Performance
  TOTAL_BENCHMARK: number;
  TOTAL_EXPENDITURES: number;
  NET_SAVINGS_LOSSES: number;
  SAVINGS_RATE_PERCENT: number;
  GENERATED_SAVINGS_LOSS: number;
  EARNED_SAVINGS_LOSS: number;
  EARNED_SHARED_SAVINGS: number;
  FINANCIAL_OUTCOME: string;

  // AIP Spending Summary
  NUM_CATEGORIES: number;
  NUM_SUBCATEGORIES: number;
  TOTAL_ACTUAL_SPENDING: number;
  TOTAL_PROJECTED_SPENDING: number;

  // Category Breakdown
  categories: CategoryBreakdown[];
}

export interface CategoryBreakdown {
  category: string;
  actual_spending: number;
  projected_spending: number;
  pct_of_total_actual: number;
  pct_of_total_projected: number;
  subcategories: SubcategoryBreakdown[];
}

export interface SubcategoryBreakdown {
  subcategory: string;
  actual_spending: number;
  projected_spending: number;
  pct_of_category_actual: number;
  pct_of_category_projected: number;
}

export interface YearSummary {
  PERFORMANCE_YEAR: number;
  TOTAL_ACOS: number;
  TOTAL_CATEGORIES: number;
  TOTAL_ACTUAL_SPENDING: number;
  TOTAL_PROJECTED_SPENDING: number;
  AVG_SPENDING_PER_ACO_ACTUAL: number;
  AVG_SPENDING_PER_ACO_PROJECTED: number;
}

export interface AIPOverviewData {
  years: number[];
  yearSummaries: YearSummary[];
  categoriesByYear: Record<number, CategorySummary[]>;
  buildTimestamp: string;
}

// ============================================================================
// Data Fetching Functions
// ============================================================================

/**
 * Fetch available performance years with AIP data
 */
export async function fetchAIPYears(): Promise<number[]> {
  const startTime = Date.now();
  console.log('[BUILD] Fetching AIP years...');

  const config = getSnowflakeConfig();
  const sql = `
    SELECT DISTINCT performance_year
    FROM ${config.database}.${config.schema}.ACO_AIP_PERFORMANCE_ANALYSIS
    WHERE spending_category IS NOT NULL
    ORDER BY performance_year DESC
  `;

  const data = await querySnowflake<{ PERFORMANCE_YEAR: number }>(sql, config);
  const years = data.map(row => row.PERFORMANCE_YEAR);
  const elapsed = Date.now() - startTime;

  console.log(`[BUILD] ✓ AIP years fetched: ${years.join(', ')} in ${elapsed}ms`);

  return years;
}

/**
 * Fetch year summary for a specific year
 */
export async function fetchYearSummary(year: number): Promise<YearSummary> {
  const startTime = Date.now();
  console.log(`[BUILD] Fetching year summary for ${year}...`);

  const config = getSnowflakeConfig();
  const sql = `
    SELECT
      performance_year AS PERFORMANCE_YEAR,
      COUNT(DISTINCT aco_id) AS TOTAL_ACOS,
      COUNT(DISTINCT spending_category) AS TOTAL_CATEGORIES,
      SUM(total_actual_spending) AS TOTAL_ACTUAL_SPENDING,
      SUM(total_projected_spending) AS TOTAL_PROJECTED_SPENDING,
      AVG(total_actual_spending) AS AVG_SPENDING_PER_ACO_ACTUAL,
      AVG(total_projected_spending) AS AVG_SPENDING_PER_ACO_PROJECTED
    FROM (
      SELECT DISTINCT
        performance_year,
        aco_id,
        spending_category,
        total_actual_spending,
        total_projected_spending
      FROM ${config.database}.${config.schema}.ACO_AIP_PERFORMANCE_ANALYSIS
      WHERE performance_year = ${year}
        AND spending_category IS NOT NULL
    )
    GROUP BY performance_year
  `;

  const data = await querySnowflake<YearSummary>(sql, config);
  const elapsed = Date.now() - startTime;

  console.log(`[BUILD] ✓ Year summary for ${year} fetched in ${elapsed}ms`);

  return data[0] || {} as YearSummary;
}

/**
 * Fetch category summary for all years
 */
export async function fetchCategorySummary(): Promise<CategorySummary[]> {
  const startTime = Date.now();
  console.log('[BUILD] Fetching category summary...');

  const config = getSnowflakeConfig();
  const sql = `
    SELECT
      PERFORMANCE_YEAR,
      SPENDING_CATEGORY,
      NUM_ACOS,
      NUM_SUBCATEGORIES,
      TOTAL_ACTUAL_SPENDING,
      TOTAL_PROJECTED_SPENDING,
      AVG_ACTUAL_PER_RECORD,
      AVG_PROJECTED_PER_RECORD,
      TOTAL_ACOS_IN_YEAR,
      YEAR_TOTAL_ACTUAL,
      YEAR_TOTAL_PROJECTED,
      PCT_OF_YEAR_ACTUAL,
      PCT_OF_YEAR_PROJECTED
    FROM ${config.database}.${config.schema}.V_AIP_CATEGORY_SUMMARY
    ORDER BY PERFORMANCE_YEAR DESC, TOTAL_ACTUAL_SPENDING DESC
  `;

  const data = await querySnowflake<CategorySummary>(sql, config);
  const elapsed = Date.now() - startTime;

  console.log(`[BUILD] ✓ Category summary fetched: ${data.length} rows in ${elapsed}ms`);

  return data;
}

/**
 * Fetch subcategory detail for a specific category and year
 */
export async function fetchSubcategoryDetail(
  category: string,
  year: number
): Promise<SubcategoryDetail[]> {
  const startTime = Date.now();
  console.log(`[BUILD] Fetching subcategory detail for ${category}, ${year}...`);

  const config = getSnowflakeConfig();
  const sql = `
    SELECT
      PERFORMANCE_YEAR,
      SPENDING_CATEGORY,
      SPENDING_SUBCATEGORY,
      NUM_ACOS,
      TOTAL_ACTUAL_SPENDING,
      TOTAL_PROJECTED_SPENDING,
      AVG_ACTUAL_PER_ACO,
      AVG_PROJECTED_PER_ACO,
      MIN_ACTUAL_SPENDING,
      MAX_ACTUAL_SPENDING,
      AVG_SAVINGS_RATE,
      ACOS_WITH_EARNINGS,
      ACOS_WITH_LOSSES
    FROM ${config.database}.${config.schema}.V_AIP_SUBCATEGORY_DETAIL
    WHERE PERFORMANCE_YEAR = ${year}
      AND SPENDING_CATEGORY = '${category.replace(/'/g, "''")}'
    ORDER BY TOTAL_ACTUAL_SPENDING DESC
  `;

  const data = await querySnowflake<SubcategoryDetail>(sql, config);
  const elapsed = Date.now() - startTime;

  console.log(`[BUILD] ✓ Subcategory detail fetched: ${data.length} rows in ${elapsed}ms`);

  return data;
}

/**
 * Fetch ACO spending detail for a specific ACO and year
 */
export async function fetchACOSpendingDetail(
  acoId: string,
  year: number
): Promise<ACOSpendingDetail[]> {
  const startTime = Date.now();
  console.log(`[BUILD] Fetching ACO spending detail for ${acoId}, ${year}...`);

  const config = getSnowflakeConfig();
  const sql = `
    SELECT
      PERFORMANCE_YEAR,
      ACO_ID,
      ACO_NAME,
      ACO_TRACK,
      ASSIGNED_BENEFICIARIES,
      SPENDING_CATEGORY,
      SPENDING_SUBCATEGORY,
      TOTAL_ACTUAL_SPENDING,
      TOTAL_PROJECTED_SPENDING,
      ACO_TOTAL_ACTUAL_SPENDING,
      ACO_TOTAL_PROJECTED_SPENDING,
      PCT_OF_TOTAL_ACTUAL,
      PCT_OF_TOTAL_PROJECTED,
      GENERATED_SAVINGS_LOSS,
      EARNED_SAVINGS_LOSS,
      SAVINGS_RATE_PERCENT,
      FINANCIAL_OUTCOME
    FROM ${config.database}.${config.schema}.V_AIP_ACO_SPENDING_PCT
    WHERE PERFORMANCE_YEAR = ${year}
      AND ACO_ID = '${acoId}'
    ORDER BY TOTAL_ACTUAL_SPENDING DESC
  `;

  const data = await querySnowflake<ACOSpendingDetail>(sql, config);
  const elapsed = Date.now() - startTime;

  console.log(`[BUILD] ✓ ACO spending detail fetched: ${data.length} rows in ${elapsed}ms`);

  return data;
}

/**
 * Fetch ACO profile with complete stats
 */
export async function fetchACOProfile(acoId: string, year: number): Promise<ACOProfile | null> {
  const startTime = Date.now();
  console.log(`[BUILD] Fetching ACO profile for ${acoId}, ${year}...`);

  const config = getSnowflakeConfig();

  // Get ACO summary stats
  const summarySQL = `
    SELECT
      a.performance_year AS PERFORMANCE_YEAR,
      a.aco_id AS ACO_ID,
      a.aco_name AS ACO_NAME,
      a.aco_track AS ACO_TRACK,
      a.assigned_beneficiaries AS ASSIGNED_BENEFICIARIES,
      a.total_benchmark AS TOTAL_BENCHMARK,
      a.total_expenditures AS TOTAL_EXPENDITURES,
      a.benchmark_minus_expenditures AS NET_SAVINGS_LOSSES,
      a.savings_rate_percent AS SAVINGS_RATE_PERCENT,
      a.generated_savings_loss AS GENERATED_SAVINGS_LOSS,
      a.earned_savings_loss AS EARNED_SAVINGS_LOSS,
      a.earned_shared_savings AS EARNED_SHARED_SAVINGS,
      a.financial_outcome AS FINANCIAL_OUTCOME,
      COUNT(DISTINCT a.spending_category) AS NUM_CATEGORIES,
      COUNT(DISTINCT a.spending_subcategory) AS NUM_SUBCATEGORIES,
      SUM(a.total_actual_spending) AS TOTAL_ACTUAL_SPENDING,
      SUM(a.total_projected_spending) AS TOTAL_PROJECTED_SPENDING
    FROM ${config.database}.${config.schema}.ACO_AIP_PERFORMANCE_ANALYSIS a
    WHERE a.performance_year = ${year}
      AND a.aco_id = '${acoId}'
      AND a.spending_category IS NOT NULL
    GROUP BY
      a.performance_year, a.aco_id, a.aco_name, a.aco_track,
      a.assigned_beneficiaries, a.total_benchmark, a.total_expenditures,
      a.benchmark_minus_expenditures, a.savings_rate_percent,
      a.generated_savings_loss, a.earned_savings_loss,
      a.earned_shared_savings, a.financial_outcome
  `;

  const summaryData = await querySnowflake<Omit<ACOProfile, 'categories'>>(summarySQL, config);

  if (summaryData.length === 0) {
    console.log(`[BUILD] ✗ No ACO profile found for ${acoId}, ${year}`);
    return null;
  }

  // Get category breakdown with subcategories
  const categorySQL = `
    SELECT
      SPENDING_CATEGORY,
      SPENDING_SUBCATEGORY,
      TOTAL_ACTUAL_SPENDING,
      TOTAL_PROJECTED_SPENDING,
      PCT_OF_TOTAL_ACTUAL,
      PCT_OF_TOTAL_PROJECTED
    FROM ${config.database}.${config.schema}.V_AIP_ACO_SPENDING_PCT
    WHERE PERFORMANCE_YEAR = ${year}
      AND ACO_ID = '${acoId}'
    ORDER BY SPENDING_CATEGORY, TOTAL_ACTUAL_SPENDING DESC
  `;

  const categoryData = await querySnowflake<{
    SPENDING_CATEGORY: string;
    SPENDING_SUBCATEGORY: string;
    TOTAL_ACTUAL_SPENDING: number;
    TOTAL_PROJECTED_SPENDING: number;
    PCT_OF_TOTAL_ACTUAL: number;
    PCT_OF_TOTAL_PROJECTED: number;
  }>(categorySQL, config);

  // Group subcategories by category
  const categoriesMap = new Map<string, CategoryBreakdown>();

  for (const row of categoryData) {
    if (!categoriesMap.has(row.SPENDING_CATEGORY)) {
      categoriesMap.set(row.SPENDING_CATEGORY, {
        category: row.SPENDING_CATEGORY,
        actual_spending: 0,
        projected_spending: 0,
        pct_of_total_actual: 0,
        pct_of_total_projected: 0,
        subcategories: [],
      });
    }

    const category = categoriesMap.get(row.SPENDING_CATEGORY)!;
    category.actual_spending += row.TOTAL_ACTUAL_SPENDING || 0;
    category.projected_spending += row.TOTAL_PROJECTED_SPENDING || 0;
    category.pct_of_total_actual += row.PCT_OF_TOTAL_ACTUAL || 0;
    category.pct_of_total_projected += row.PCT_OF_TOTAL_PROJECTED || 0;

    category.subcategories.push({
      subcategory: row.SPENDING_SUBCATEGORY,
      actual_spending: row.TOTAL_ACTUAL_SPENDING || 0,
      projected_spending: row.TOTAL_PROJECTED_SPENDING || 0,
      pct_of_category_actual:
        category.actual_spending > 0
          ? ((row.TOTAL_ACTUAL_SPENDING || 0) / category.actual_spending) * 100
          : 0,
      pct_of_category_projected:
        category.projected_spending > 0
          ? ((row.TOTAL_PROJECTED_SPENDING || 0) / category.projected_spending) * 100
          : 0,
    });
  }

  const profile: ACOProfile = {
    ...summaryData[0],
    categories: Array.from(categoriesMap.values()),
  };

  const elapsed = Date.now() - startTime;
  console.log(`[BUILD] ✓ ACO profile fetched in ${elapsed}ms`);

  return profile;
}

/**
 * Fetch all ACOs with AIP data for a given year (for dropdown/selection)
 */
export async function fetchACOList(year: number): Promise<{ ACO_ID: string; ACO_NAME: string; ACO_TRACK: string; TOTAL_SPENDING: number; }[]> {
  const startTime = Date.now();
  console.log(`[BUILD] Fetching ACO list for ${year}...`);

  const config = getSnowflakeConfig();
  const sql = `
    SELECT DISTINCT
      aco_id AS ACO_ID,
      aco_name AS ACO_NAME,
      aco_track AS ACO_TRACK,
      SUM(total_actual_spending) AS TOTAL_SPENDING
    FROM ${config.database}.${config.schema}.ACO_AIP_PERFORMANCE_ANALYSIS
    WHERE performance_year = ${year}
      AND spending_category IS NOT NULL
    GROUP BY aco_id, aco_name, aco_track
    ORDER BY aco_name
  `;

  const data = await querySnowflake<{
    ACO_ID: string;
    ACO_NAME: string;
    ACO_TRACK: string;
    TOTAL_SPENDING: number;
  }>(sql, config);
  const elapsed = Date.now() - startTime;

  console.log(`[BUILD] ✓ ACO list fetched: ${data.length} ACOs in ${elapsed}ms`);

  return data;
}

/**
 * Fetch complete AIP overview data (for dashboard homepage)
 */
export async function fetchAIPOverviewData(): Promise<AIPOverviewData> {
  const startTime = Date.now();
  console.log('[BUILD] ===== Fetching AIP Overview Data =====');

  // Get available years
  const years = await fetchAIPYears();

  if (years.length === 0) {
    console.warn('[BUILD] No AIP years found in database');
    return {
      years: [],
      yearSummaries: [],
      categoriesByYear: {},
      buildTimestamp: new Date().toISOString(),
    };
  }

  // Fetch year summaries and category data in parallel
  const [yearSummaries, categorySummary] = await Promise.all([
    Promise.all(years.map(year => fetchYearSummary(year))),
    fetchCategorySummary(),
  ]);

  // Group categories by year
  const categoriesByYear: Record<number, CategorySummary[]> = {};
  for (const category of categorySummary) {
    if (!categoriesByYear[category.PERFORMANCE_YEAR]) {
      categoriesByYear[category.PERFORMANCE_YEAR] = [];
    }
    categoriesByYear[category.PERFORMANCE_YEAR].push(category);
  }

  const elapsed = Date.now() - startTime;

  console.log(`[BUILD] ✓ AIP overview data complete in ${elapsed}ms`);
  console.log(`[BUILD] Years loaded: ${years.join(', ')}`);
  console.log(`[BUILD] Data timestamp: ${new Date().toISOString()}`);

  return {
    years,
    yearSummaries,
    categoriesByYear,
    buildTimestamp: new Date().toISOString(),
  };
}
