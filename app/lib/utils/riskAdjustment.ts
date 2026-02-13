/**
 * Risk Adjustment Utilities
 *
 * Provides functions for calculating and applying CMS HCC risk score adjustments
 * to ACO performance metrics.
 */

import type { ACORanking } from '@/lib/data/aco';

/**
 * Metrics that should be adjusted by risk scores
 */
const ADJUSTABLE_METRICS = new Set([
  'COST_PER_BENEFICIARY',
  'SNF_ADMISSIONS_PER_1K',
  'IP_ADMISSIONS',
  'ED_VISITS_PER_1K',
  'READMISSION_RATE_PER_1000',
  'PCP_VISITS_PER_1K',
  'SPECIALIST_VISITS_PER_1K',
  'SNF_LENGTH_OF_STAY',
  'SNF_PAY_PER_STAY',
  'ED_VISITS_HOSP_PER_1K',
]);

/**
 * Calculate composite risk score using weighted average of population segments
 *
 * Formula:
 * composite_risk_score =
 *   (AGED_NONDUAL_BENES / TOTAL_BENEFICIARIES) × RISK_SCORE_AGED_NON_DUAL +
 *   (AGED_DUAL_BENES / TOTAL_BENEFICIARIES) × RISK_SCORE_AGED_DUAL +
 *   (DISABLED_BENES / TOTAL_BENEFICIARIES) × RISK_SCORE_DISABLED
 *
 * @param aco - ACO ranking data
 * @returns Composite risk score or null if insufficient data
 */
export function calculateCompositeRiskScore(aco: ACORanking): number | null {
  const totalBenes = aco.TOTAL_BENEFICIARIES;

  // Require minimum data to calculate
  if (!totalBenes || totalBenes === 0) return null;

  const agedNonDualBenes = aco.AGED_NONDUAL_BENES || 0;
  const agedDualBenes = aco.AGED_DUAL_BENES || 0;
  const disabledBenes = aco.DISABLED_BENES || 0;

  const riskScoreAgedNonDual = aco.RISK_SCORE_AGED_NON_DUAL;
  const riskScoreAgedDual = aco.RISK_SCORE_AGED_DUAL;
  const riskScoreDisabled = aco.RISK_SCORE_DISABLED;

  // Check if we have at least one risk score
  if (!riskScoreAgedNonDual && !riskScoreAgedDual && !riskScoreDisabled) {
    return null;
  }

  // Calculate weighted average (use 0 if risk score is missing for a segment)
  let weightedSum = 0;
  let totalWeight = 0;

  if (agedNonDualBenes > 0 && riskScoreAgedNonDual) {
    weightedSum += (agedNonDualBenes / totalBenes) * riskScoreAgedNonDual;
    totalWeight += agedNonDualBenes / totalBenes;
  }

  if (agedDualBenes > 0 && riskScoreAgedDual) {
    weightedSum += (agedDualBenes / totalBenes) * riskScoreAgedDual;
    totalWeight += agedDualBenes / totalBenes;
  }

  if (disabledBenes > 0 && riskScoreDisabled) {
    weightedSum += (disabledBenes / totalBenes) * riskScoreDisabled;
    totalWeight += disabledBenes / totalBenes;
  }

  // Return null if we don't have meaningful coverage
  if (totalWeight < 0.5) return null; // At least 50% coverage required

  return weightedSum;
}

/**
 * Apply risk adjustment to a metric value
 *
 * Uses indirect standardization: adjusted_metric = actual_metric / composite_risk_score
 * This normalizes metrics to an average risk population (risk score = 1.0)
 *
 * @param actualValue - The unadjusted metric value
 * @param riskScore - The composite risk score
 * @returns Risk-adjusted value or null if insufficient data
 */
export function applyRiskAdjustment(
  actualValue: number | null | undefined,
  riskScore: number | null | undefined
): number | null {
  if (actualValue === null || actualValue === undefined) return null;
  if (!riskScore || riskScore === 0) return null;

  return actualValue / riskScore;
}

/**
 * Check if a metric should be adjusted by risk scores
 *
 * @param metricKey - The metric key (e.g., 'COST_PER_BENEFICIARY')
 * @returns True if the metric should be adjusted
 */
export function shouldAdjustMetric(metricKey: string): boolean {
  return ADJUSTABLE_METRICS.has(metricKey);
}

/**
 * Get the display value for a metric, adjusted or unadjusted
 *
 * @param aco - ACO ranking data
 * @param metricKey - The metric key
 * @param isRiskAdjusted - Whether to apply risk adjustment
 * @returns The metric value (adjusted if applicable) or null
 */
export function getMetricDisplayValue(
  aco: ACORanking,
  metricKey: keyof ACORanking,
  isRiskAdjusted: boolean
): number | null {
  const actualValue = aco[metricKey];

  // Type guard to ensure we're working with numbers
  if (typeof actualValue !== 'number') return null;

  // If not risk adjusted or metric shouldn't be adjusted, return actual value
  if (!isRiskAdjusted || !shouldAdjustMetric(metricKey as string)) {
    return actualValue;
  }

  // Apply risk adjustment
  const compositeRiskScore = aco.COMPOSITE_RISK_SCORE;
  const adjustedValue = applyRiskAdjustment(actualValue, compositeRiskScore);

  // Return adjusted value if available, otherwise fall back to actual value
  return adjustedValue !== null ? adjustedValue : actualValue;
}

/**
 * Format risk score for display
 *
 * @param score - The risk score value
 * @returns Formatted string (3 decimals)
 */
export function formatRiskScore(score: number | null | undefined): string {
  if (score === null || score === undefined) return 'N/A';
  return score.toFixed(3);
}

/**
 * Check if an ACO has missing risk score data when risk adjustment is enabled
 *
 * @param aco - ACO ranking data
 * @returns True if risk score is missing
 */
export function hasMissingRiskScore(aco: ACORanking): boolean {
  return aco.COMPOSITE_RISK_SCORE === null || aco.COMPOSITE_RISK_SCORE === undefined;
}
