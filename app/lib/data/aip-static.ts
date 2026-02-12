/**
 * AIP Analysis - Static Data Loading
 *
 * Loads pre-exported JSON data for fast, reliable builds
 */

import categoryData from '@/data/aip/category_summary.json';
import subcategoryData from '@/data/aip/subcategory_detail.json';
import acoSpendingData from '@/data/aip/aco_spending.json';
import metadata from '@/data/aip/metadata.json';

// Re-export types from aip.ts
export type {
  CategorySummary,
  SubcategoryDetail,
  ACOSpendingDetail,
  ACOProfile,
  CategoryBreakdown,
  SubcategoryBreakdown,
  YearSummary,
  AIPOverviewData,
} from './aip';

import type {
  CategorySummary,
  SubcategoryDetail,
  ACOSpendingDetail,
  YearSummary,
  AIPOverviewData,
  ACOProfile,
  CategoryBreakdown,
} from './aip';

/**
 * Get available years
 */
export function getAIPYears(): number[] {
  return metadata.years;
}

/**
 * Get year summary
 */
export function getYearSummary(year: number): YearSummary {
  const yearCategories = categoryData.filter(c => c.PERFORMANCE_YEAR === year);
  const acoSpending = acoSpendingData.filter(a => a.PERFORMANCE_YEAR === year);

  const uniqueACOs = new Set(acoSpending.map(a => a.ACO_ID)).size;
  const uniqueCategories = new Set(yearCategories.map(c => c.SPENDING_CATEGORY)).size;

  const totalActual = acoSpending.reduce((sum, a) => sum + (a.TOTAL_ACTUAL_SPENDING || 0), 0);
  const totalProjected = acoSpending.reduce((sum, a) => sum + (a.TOTAL_PROJECTED_SPENDING || 0), 0);

  return {
    PERFORMANCE_YEAR: year,
    TOTAL_ACOS: uniqueACOs,
    TOTAL_CATEGORIES: uniqueCategories,
    TOTAL_ACTUAL_SPENDING: totalActual,
    TOTAL_PROJECTED_SPENDING: totalProjected,
    AVG_SPENDING_PER_ACO_ACTUAL: uniqueACOs > 0 ? totalActual / uniqueACOs : 0,
    AVG_SPENDING_PER_ACO_PROJECTED: uniqueACOs > 0 ? totalProjected / uniqueACOs : 0,
  };
}

/**
 * Get category summary for all years
 */
export function getCategorySummary(): CategorySummary[] {
  return categoryData as CategorySummary[];
}

/**
 * Get subcategory detail for a specific category and year
 */
export function getSubcategoryDetail(category: string, year: number): SubcategoryDetail[] {
  return subcategoryData.filter(
    s => s.SPENDING_CATEGORY === category && s.PERFORMANCE_YEAR === year
  ) as SubcategoryDetail[];
}

/**
 * Get ACO spending detail for a specific ACO and year
 */
export function getACOSpendingDetail(acoId: string, year: number): ACOSpendingDetail[] {
  return acoSpendingData.filter(
    a => a.ACO_ID === acoId && a.PERFORMANCE_YEAR === year
  ) as ACOSpendingDetail[];
}

/**
 * Get ACO profile with complete stats
 */
export function getACOProfile(acoId: string, year: number): ACOProfile | null {
  const spending = acoSpendingData.filter(
    a => a.ACO_ID === acoId && a.PERFORMANCE_YEAR === year
  );

  if (spending.length === 0) {
    return null;
  }

  // Get first record for basic info
  const first = spending[0];

  // Calculate totals
  const totalActual = spending.reduce((sum, s) => sum + (s.TOTAL_ACTUAL_SPENDING || 0), 0);
  const totalProjected = spending.reduce((sum, s) => sum + (s.TOTAL_PROJECTED_SPENDING || 0), 0);

  // Group by category
  const categoriesMap = new Map<string, CategoryBreakdown>();

  for (const row of spending) {
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
    const actualSpending = row.TOTAL_ACTUAL_SPENDING || 0;
    const projectedSpending = row.TOTAL_PROJECTED_SPENDING || 0;

    category.actual_spending += actualSpending;
    category.projected_spending += projectedSpending;

    category.subcategories.push({
      subcategory: row.SPENDING_SUBCATEGORY,
      actual_spending: actualSpending,
      projected_spending: projectedSpending,
      pct_of_category_actual:
        category.actual_spending > 0 ? (actualSpending / category.actual_spending) * 100 : 0,
      pct_of_category_projected:
        category.projected_spending > 0 ? (projectedSpending / category.projected_spending) * 100 : 0,
    });
  }

  // Update category percentages
  for (const category of Array.from(categoriesMap.values())) {
    category.pct_of_total_actual = totalActual > 0 ? (category.actual_spending / totalActual) * 100 : 0;
    category.pct_of_total_projected = totalProjected > 0 ? (category.projected_spending / totalProjected) * 100 : 0;
  }

  return {
    PERFORMANCE_YEAR: year,
    ACO_ID: first.ACO_ID,
    ACO_NAME: first.ACO_NAME,
    ACO_TRACK: first.ACO_TRACK || 'Unknown',
    ASSIGNED_BENEFICIARIES: first.ASSIGNED_BENEFICIARIES || 0,
    TOTAL_BENCHMARK: 0, // Not in spending data
    TOTAL_EXPENDITURES: 0,
    NET_SAVINGS_LOSSES: first.GENERATED_SAVINGS_LOSS || 0,
    SAVINGS_RATE_PERCENT: first.SAVINGS_RATE_PERCENT || 0,
    GENERATED_SAVINGS_LOSS: first.GENERATED_SAVINGS_LOSS || 0,
    EARNED_SAVINGS_LOSS: first.EARNED_SAVINGS_LOSS || 0,
    EARNED_SHARED_SAVINGS: 0,
    FINANCIAL_OUTCOME: first.FINANCIAL_OUTCOME || 'Unknown',
    NUM_CATEGORIES: categoriesMap.size,
    NUM_SUBCATEGORIES: spending.length,
    TOTAL_ACTUAL_SPENDING: totalActual,
    TOTAL_PROJECTED_SPENDING: totalProjected,
    categories: Array.from(categoriesMap.values()),
  };
}

/**
 * Get list of all ACOs with AIP data for a given year
 */
export function getACOList(year: number): { ACO_ID: string; ACO_NAME: string; ACO_TRACK: string; TOTAL_SPENDING: number; }[] {
  const yearData = acoSpendingData.filter(a => a.PERFORMANCE_YEAR === year);

  // Group by ACO
  const acosMap = new Map<string, { ACO_ID: string; ACO_NAME: string; ACO_TRACK: string; TOTAL_SPENDING: number; }>();

  for (const row of yearData) {
    if (!acosMap.has(row.ACO_ID)) {
      acosMap.set(row.ACO_ID, {
        ACO_ID: row.ACO_ID,
        ACO_NAME: row.ACO_NAME,
        ACO_TRACK: row.ACO_TRACK,
        TOTAL_SPENDING: 0,
      });
    }

    const aco = acosMap.get(row.ACO_ID)!;
    aco.TOTAL_SPENDING += row.TOTAL_ACTUAL_SPENDING || row.TOTAL_PROJECTED_SPENDING || 0;
  }

  return Array.from(acosMap.values()).sort((a, b) => a.ACO_NAME.localeCompare(b.ACO_NAME));
}

/**
 * Get complete AIP overview data
 */
export function getAIPOverviewData(): AIPOverviewData {
  const years = getAIPYears();
  const yearSummaries = years.map(year => getYearSummary(year));

  // Group categories by year
  const categoriesByYear: Record<number, CategorySummary[]> = {};
  for (const category of categoryData) {
    if (!categoriesByYear[category.PERFORMANCE_YEAR]) {
      categoriesByYear[category.PERFORMANCE_YEAR] = [];
    }
    categoriesByYear[category.PERFORMANCE_YEAR].push(category as CategorySummary);
  }

  return {
    years,
    yearSummaries,
    categoriesByYear,
    buildTimestamp: metadata.generated_at,
  };
}
