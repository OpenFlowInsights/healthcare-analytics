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
  PERFORMANCE_YEAR: number;
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
  PERFORMANCE_YEAR: number;

  // Contact information
  ACO_OWNER?: string; // Parsed email domain
  CONTACT_NAME?: string;
  CONTACT_EMAIL?: string;
  CONTACT_PHONE?: string;
  REPORTING_WEBSITE?: string;
  SERVICE_AREA?: string;

  // Beneficiary counts
  TOTAL_BENEFICIARIES: number;
  AGED_NONDUAL_BENES?: number;
  AGED_DUAL_BENES?: number;
  DISABLED_BENES?: number;
  ESRD_BENES?: number;

  // Financial metrics
  BENCHMARK_EXPENDITURE?: number;
  TOTAL_EXPENDITURE?: number;
  SAVINGS_LOSSES?: number;
  EARNED_SHARED_SAVINGS_PAYMENT?: number;
  SAVINGS_RATE_PCT: number;
  COST_PER_BENEFICIARY?: number;

  // Quality and Performance
  QUALITY_SCORE: number;
  SAVINGS_RATE_RANK: number;
  PERFORMANCE_CATEGORY: string;

  // Utilization metrics
  IP_ADMISSIONS?: number;
  ED_VISITS_PER_1K?: number;
  ED_VISITS_HOSP_PER_1K?: number;
  PCP_VISITS_PER_1K?: number;
  SPECIALIST_VISITS_PER_1K?: number;
  READMISSION_RATE_PER_1000?: number;
  SNF_LENGTH_OF_STAY?: number;
  SNF_ADMISSIONS_PER_1K?: number;
  SNF_PAY_PER_STAY?: number;

  // Provider counts
  NUM_PCPS?: number;
  NUM_SPECIALISTS?: number;
  NUM_FQHCS?: number;
  NUM_RHCS?: number;
  NUM_HOSPITALS?: number;

  // SNF Waiver
  SNF_WAIVER?: string;
}

export interface YearlyData {
  summary: DashboardSummary;
  rankings: ACORanking[];
}

export interface MultiYearDashboardData {
  years: number[];
  dataByYear: Record<number, YearlyData>;
  buildTimestamp: string;
}

/**
 * Fetch available performance years (limited to 2021-2024)
 */
export async function fetchAvailableYears(): Promise<number[]> {
  const startTime = Date.now();
  console.log('[BUILD] Fetching available years...');

  const config = getSnowflakeConfig();
  const sql = `
    SELECT DISTINCT "performance_year" AS PERFORMANCE_YEAR
    FROM ${config.database}.${config.schema}.ACO_PUF
    WHERE "performance_year" IS NOT NULL
      AND "performance_year" BETWEEN 2021 AND 2024
    ORDER BY "performance_year" DESC
  `;

  const data = await querySnowflake<{ PERFORMANCE_YEAR: number }>(sql, config);
  const years = data.map(row => row.PERFORMANCE_YEAR);
  const elapsed = Date.now() - startTime;

  console.log(`[BUILD] ✓ Available years fetched: ${years.join(', ')} in ${elapsed}ms`);

  return years;
}

/**
 * Fetch dashboard summary KPIs for a specific year
 */
export async function fetchDashboardSummary(year: number): Promise<DashboardSummary> {
  const startTime = Date.now();
  console.log(`[BUILD] Fetching dashboard summary for year ${year}...`);

  const config = getSnowflakeConfig();
  const sql = `
    SELECT
      ${year} as PERFORMANCE_YEAR,
      COUNT(DISTINCT "aco_id") as TOTAL_ACOS,
      COUNT(DISTINCT CASE WHEN TRY_CAST(REPLACE("sav_rate", '%', '') AS FLOAT) > 0 THEN "aco_id" END) as ACOS_WITH_SAVINGS,
      COUNT(DISTINCT CASE WHEN TRY_CAST(REPLACE("sav_rate", '%', '') AS FLOAT) < 0 THEN "aco_id" END) as ACOS_WITH_LOSSES,
      SUM(TRY_CAST(REPLACE(REPLACE("n_ab", ',', ''), '$', '') AS INTEGER)) as TOTAL_BENEFICIARIES,
      SUM(TRY_CAST(REPLACE(REPLACE("abtotbnchmk", ',', ''), '$', '') AS DECIMAL(18,2))) as TOTAL_BENCHMARK_EXPENDITURE,
      SUM(TRY_CAST(REPLACE(REPLACE("abtotexp", ',', ''), '$', '') AS DECIMAL(18,2))) as TOTAL_ACTUAL_EXPENDITURE,
      SUM(TRY_CAST(REPLACE(REPLACE("gensaveloss", ',', ''), '$', '') AS DECIMAL(18,2))) as TOTAL_SAVINGS_LOSSES,
      AVG(TRY_CAST(REPLACE("sav_rate", '%', '') AS FLOAT)) as AVG_SAVINGS_RATE_PCT,
      AVG(TRY_CAST(REPLACE("qualscore", '%', '') AS FLOAT)) as AVG_QUALITY_SCORE
    FROM ${config.database}.${config.schema}.ACO_PUF
    WHERE "performance_year" = ${year}
  `;

  const data = await querySnowflake<DashboardSummary>(sql, config);
  const elapsed = Date.now() - startTime;

  console.log(`[BUILD] ✓ Dashboard summary for ${year} fetched in ${elapsed}ms`);

  return data[0] || {} as DashboardSummary;
}

/**
 * Fetch ACO rankings for a specific year
 * Returns deduplicated ACOs for client-side filtering/sorting
 */
export async function fetchACORankings(year: number): Promise<ACORanking[]> {
  const startTime = Date.now();
  console.log(`[BUILD] Fetching ACO rankings for year ${year}...`);

  const config = getSnowflakeConfig();
  const sql = `
    WITH base_data AS (
      SELECT
        "aco_id",
        "aco_name",
        "aco_state",
        "current_track",
        "performance_year",
        "n_ab",
        "sav_rate",
        "qualscore",
        -- Beneficiary breakdown
        "n_ab_year_aged_nondual_py",
        "n_ab_year_aged_dual_py",
        "n_ab_year_dis_py",
        "n_ab_year_esrd_py",
        -- Financial metrics
        "abtotbnchmk",
        "abtotexp",
        "gensaveloss",
        "earnsaveloss",
        "per_capita_exp_total_py",
        -- Utilization metrics
        "adm",
        "p_edv_vis",
        "p_em_pcp_vis",
        "p_em_sp_vis",
        "readm_rate_1000",
        "snf_los",
        "p_snf_adm",
        "snf_payperstay",
        "p_edv_vis_hosp",
        -- Provider counts
        "n_pcp",
        "n_spec",
        "n_fqhc",
        "n_rhc",
        "n_hosp"
      FROM ${config.database}.${config.schema}.ACO_PUF
      WHERE "performance_year" = ${year}
        AND "sav_rate" IS NOT NULL
    ),
    deduplicated AS (
      SELECT
        "aco_id",
        MAX("aco_name") as "aco_name",
        MAX("aco_state") as "aco_state",
        MAX("current_track") as "current_track",
        MAX("performance_year") as "performance_year",
        MAX("n_ab") as "n_ab",
        MAX("sav_rate") as "sav_rate",
        MAX("qualscore") as "qualscore",
        -- Beneficiary breakdown
        MAX("n_ab_year_aged_nondual_py") as "n_ab_year_aged_nondual_py",
        MAX("n_ab_year_aged_dual_py") as "n_ab_year_aged_dual_py",
        MAX("n_ab_year_dis_py") as "n_ab_year_dis_py",
        MAX("n_ab_year_esrd_py") as "n_ab_year_esrd_py",
        -- Financial metrics
        MAX("abtotbnchmk") as "abtotbnchmk",
        MAX("abtotexp") as "abtotexp",
        MAX("gensaveloss") as "gensaveloss",
        MAX("earnsaveloss") as "earnsaveloss",
        MAX("per_capita_exp_total_py") as "per_capita_exp_total_py",
        -- Utilization metrics
        MAX("adm") as "adm",
        MAX("p_edv_vis") as "p_edv_vis",
        MAX("p_em_pcp_vis") as "p_em_pcp_vis",
        MAX("p_em_sp_vis") as "p_em_sp_vis",
        MAX("readm_rate_1000") as "readm_rate_1000",
        MAX("snf_los") as "snf_los",
        MAX("p_snf_adm") as "p_snf_adm",
        MAX("snf_payperstay") as "snf_payperstay",
        MAX("p_edv_vis_hosp") as "p_edv_vis_hosp",
        -- Provider counts
        MAX("n_pcp") as "n_pcp",
        MAX("n_spec") as "n_spec",
        MAX("n_fqhc") as "n_fqhc",
        MAX("n_rhc") as "n_rhc",
        MAX("n_hosp") as "n_hosp"
      FROM base_data
      GROUP BY "aco_id"
    )
    SELECT
      deduplicated."aco_id" as ACO_ID,
      deduplicated."aco_name" as ACO_NAME,
      COALESCE(deduplicated."aco_state", 'Unknown') as ACO_STATE,
      COALESCE(deduplicated."current_track", 'Unknown') as ACO_TRACK,
      deduplicated."performance_year" as PERFORMANCE_YEAR,

      -- Basic counts
      TRY_CAST(REPLACE(REPLACE(deduplicated."n_ab", ',', ''), '$', '') AS INTEGER) as TOTAL_BENEFICIARIES,
      TRY_CAST(REPLACE(deduplicated."sav_rate", '%', '') AS FLOAT) as SAVINGS_RATE_PCT,
      TRY_CAST(REPLACE(deduplicated."qualscore", '%', '') AS FLOAT) as QUALITY_SCORE,
      ROW_NUMBER() OVER (ORDER BY TRY_CAST(REPLACE(deduplicated."sav_rate", '%', '') AS FLOAT) DESC NULLS LAST) as SAVINGS_RATE_RANK,
      CASE
        WHEN TRY_CAST(REPLACE(deduplicated."sav_rate", '%', '') AS FLOAT) > 5 THEN 'High Saver'
        WHEN TRY_CAST(REPLACE(deduplicated."sav_rate", '%', '') AS FLOAT) BETWEEN 0 AND 5 THEN 'Moderate Saver'
        WHEN TRY_CAST(REPLACE(deduplicated."sav_rate", '%', '') AS FLOAT) BETWEEN -5 AND 0 THEN 'Slight Loss'
        WHEN TRY_CAST(REPLACE(deduplicated."sav_rate", '%', '') AS FLOAT) < -5 THEN 'High Loss'
        ELSE 'Unknown'
      END as PERFORMANCE_CATEGORY,

      -- Beneficiary breakdown
      TRY_CAST(REPLACE(REPLACE(deduplicated."n_ab_year_aged_nondual_py", ',', ''), '$', '') AS INTEGER) as AGED_NONDUAL_BENES,
      TRY_CAST(REPLACE(REPLACE(deduplicated."n_ab_year_aged_dual_py", ',', ''), '$', '') AS INTEGER) as AGED_DUAL_BENES,
      TRY_CAST(REPLACE(REPLACE(deduplicated."n_ab_year_dis_py", ',', ''), '$', '') AS INTEGER) as DISABLED_BENES,
      TRY_CAST(REPLACE(REPLACE(deduplicated."n_ab_year_esrd_py", ',', ''), '$', '') AS INTEGER) as ESRD_BENES,

      -- Financial metrics
      TRY_CAST(REPLACE(REPLACE(deduplicated."abtotbnchmk", ',', ''), '$', '') AS DECIMAL(18,2)) as BENCHMARK_EXPENDITURE,
      TRY_CAST(REPLACE(REPLACE(deduplicated."abtotexp", ',', ''), '$', '') AS DECIMAL(18,2)) as TOTAL_EXPENDITURE,
      TRY_CAST(REPLACE(REPLACE(deduplicated."gensaveloss", ',', ''), '$', '') AS DECIMAL(18,2)) as SAVINGS_LOSSES,
      TRY_CAST(REPLACE(REPLACE(deduplicated."earnsaveloss", ',', ''), '$', '') AS DECIMAL(18,2)) as EARNED_SHARED_SAVINGS_PAYMENT,
      deduplicated."per_capita_exp_total_py" as COST_PER_BENEFICIARY,

      -- Utilization metrics
      TRY_CAST(REPLACE(REPLACE(deduplicated."adm", ',', ''), '$', '') AS DECIMAL(12,2)) as IP_ADMISSIONS,
      TRY_CAST(REPLACE(REPLACE(deduplicated."p_edv_vis", ',', ''), '$', '') AS DECIMAL(12,2)) as ED_VISITS_PER_1K,
      TRY_CAST(REPLACE(REPLACE(deduplicated."p_em_pcp_vis", ',', ''), '$', '') AS DECIMAL(12,2)) as PCP_VISITS_PER_1K,
      TRY_CAST(REPLACE(REPLACE(deduplicated."p_em_sp_vis", ',', ''), '$', '') AS DECIMAL(12,2)) as SPECIALIST_VISITS_PER_1K,
      deduplicated."readm_rate_1000" as READMISSION_RATE_PER_1000,
      deduplicated."snf_los" as SNF_LENGTH_OF_STAY,
      TRY_CAST(REPLACE(REPLACE(deduplicated."p_snf_adm", ',', ''), '$', '') AS DECIMAL(12,2)) as SNF_ADMISSIONS_PER_1K,
      TRY_CAST(REPLACE(REPLACE(deduplicated."snf_payperstay", ',', ''), '$', '') AS DECIMAL(12,2)) as SNF_PAY_PER_STAY,
      TRY_CAST(REPLACE(REPLACE(deduplicated."p_edv_vis_hosp", ',', ''), '$', '') AS DECIMAL(12,2)) as ED_VISITS_HOSP_PER_1K,
      CAST(NULL AS VARCHAR) as SNF_WAIVER,

      -- Provider counts
      TRY_CAST(REPLACE(REPLACE(deduplicated."n_pcp", ',', ''), '$', '') AS INTEGER) as NUM_PCPS,
      TRY_CAST(REPLACE(REPLACE(deduplicated."n_spec", ',', ''), '$', '') AS INTEGER) as NUM_SPECIALISTS,
      TRY_CAST(REPLACE(REPLACE(deduplicated."n_fqhc", ',', ''), '$', '') AS INTEGER) as NUM_FQHCS,
      TRY_CAST(REPLACE(REPLACE(deduplicated."n_rhc", ',', ''), '$', '') AS INTEGER) as NUM_RHCS,
      TRY_CAST(REPLACE(REPLACE(deduplicated."n_hosp", ',', ''), '$', '') AS INTEGER) as NUM_HOSPITALS,

      -- Contact information (TODO: Update with correct column names from ACO_ORGANIZATIONS)
      CAST(NULL AS VARCHAR) as ACO_OWNER,
      CAST(NULL AS VARCHAR) as CONTACT_NAME,
      CAST(NULL AS VARCHAR) as CONTACT_EMAIL,
      CAST(NULL AS VARCHAR) as CONTACT_PHONE,
      CAST(NULL AS VARCHAR) as REPORTING_WEBSITE,
      CAST(NULL AS VARCHAR) as SERVICE_AREA
    FROM deduplicated
    ORDER BY TRY_CAST(REPLACE(deduplicated."sav_rate", '%', '') AS FLOAT) DESC NULLS LAST
  `;

  const data = await querySnowflake<ACORanking>(sql, config);
  const elapsed = Date.now() - startTime;

  console.log(`[BUILD] ✓ ACO rankings for ${year} fetched: ${data.length} rows (deduplicated) in ${elapsed}ms`);

  return data;
}

/**
 * Fetch detailed ACO performance data for comparison and detail views
 * Includes financial, utilization, and membership breakdown metrics
 */
export async function fetchACODetails(acoId: string, year: number) {
  const startTime = Date.now();
  console.log(`[BUILD] Fetching detailed data for ACO ${acoId}, year ${year}...`);

  const config = getSnowflakeConfig();
  const sql = `
    SELECT
      "aco_id" as ACO_ID,
      "aco_name" as ACO_NAME,
      COALESCE("aco_state", 'Unknown') as ACO_STATE,
      COALESCE("current_track", 'Unknown') as ACO_TRACK,
      "performance_year" as PERFORMANCE_YEAR,

      -- Beneficiary counts
      TRY_CAST(REPLACE(REPLACE("n_ab", ',', ''), '$', '') AS INTEGER) as TOTAL_BENEFICIARIES,
      TRY_CAST(REPLACE(REPLACE("n_ab_year_aged_nondual_py", ',', ''), '$', '') AS INTEGER) as AGED_NONDUAL_BENES,
      TRY_CAST(REPLACE(REPLACE("n_ab_year_aged_dual_py", ',', ''), '$', '') AS INTEGER) as AGED_DUAL_BENES,
      TRY_CAST(REPLACE(REPLACE("n_ab_year_dis_py", ',', ''), '$', '') AS INTEGER) as DISABLED_BENES,
      TRY_CAST(REPLACE(REPLACE("n_ab_year_esrd_py", ',', ''), '$', '') AS INTEGER) as ESRD_BENES,

      -- Financial metrics
      TRY_CAST(REPLACE(REPLACE("abtotbnchmk", ',', ''), '$', '') AS DECIMAL(18,2)) as BENCHMARK_EXPENDITURE,
      TRY_CAST(REPLACE(REPLACE("abtotexp", ',', ''), '$', '') AS DECIMAL(18,2)) as TOTAL_EXPENDITURE,
      TRY_CAST(REPLACE(REPLACE("gensaveloss", ',', ''), '$', '') AS DECIMAL(18,2)) as SAVINGS_LOSSES,
      TRY_CAST(REPLACE(REPLACE("earnsaveloss", ',', ''), '$', '') AS DECIMAL(18,2)) as EARNED_SHARED_SAVINGS_PAYMENT,
      TRY_CAST(REPLACE("sav_rate", '%', '') AS FLOAT) as SAVINGS_RATE_PCT,
      "per_capita_exp_total_py" as COST_PER_BENEFICIARY,

      -- Quality and risk
      TRY_CAST(REPLACE("qualscore", '%', '') AS FLOAT) as QUALITY_SCORE,
      TRY_CAST("cms_hcc_riskscore_agnd_py" AS DECIMAL(6,4)) as RISK_SCORE_AGED_NON_DUAL,
      TRY_CAST("cms_hcc_riskscore_agdu_py" AS DECIMAL(6,4)) as RISK_SCORE_AGED_DUAL,
      TRY_CAST("cms_hcc_riskscore_dis_py" AS DECIMAL(6,4)) as RISK_SCORE_DISABLED,

      -- Utilization metrics
      TRY_CAST(REPLACE(REPLACE("adm", ',', ''), '$', '') AS DECIMAL(12,2)) as IP_ADMISSIONS,
      TRY_CAST(REPLACE(REPLACE("p_edv_vis", ',', ''), '$', '') AS DECIMAL(12,2)) as ED_VISITS_PER_1K,
      TRY_CAST(REPLACE(REPLACE("p_em_pcp_vis", ',', ''), '$', '') AS DECIMAL(12,2)) as PCP_VISITS_PER_1K,
      TRY_CAST(REPLACE(REPLACE("p_em_sp_vis", ',', ''), '$', '') AS DECIMAL(12,2)) as SPECIALIST_VISITS_PER_1K,
      "readm_rate_1000" as READMISSION_RATE_PER_1000,
      "snf_los" as SNF_LENGTH_OF_STAY,
      TRY_CAST(REPLACE(REPLACE("p_snf_adm", ',', ''), '$', '') AS DECIMAL(12,2)) as SNF_ADMISSIONS_PER_1K,

      -- Provider counts
      TRY_CAST(REPLACE(REPLACE("n_pcp", ',', ''), '$', '') AS INTEGER) as NUM_PCPS,
      TRY_CAST(REPLACE(REPLACE("n_spec", ',', ''), '$', '') AS INTEGER) as NUM_SPECIALISTS,
      TRY_CAST(REPLACE(REPLACE("n_fqhc", ',', ''), '$', '') AS INTEGER) as NUM_FQHCS,
      TRY_CAST(REPLACE(REPLACE("n_rhc", ',', ''), '$', '') AS INTEGER) as NUM_RHCS,
      TRY_CAST(REPLACE(REPLACE("n_hosp", ',', ''), '$', '') AS INTEGER) as NUM_HOSPITALS
    FROM ${config.database}.${config.schema}.ACO_PUF
    WHERE "aco_id" = '${acoId}' AND "performance_year" = ${year}
    LIMIT 1
  `;

  const data = await querySnowflake<any>(sql, config);
  const elapsed = Date.now() - startTime;

  console.log(`[BUILD] ✓ ACO details fetched in ${elapsed}ms`);

  return data[0] || null;
}

/**
 * Fetch list of all ACOs for selector dropdown
 * Deduplicates by ACO_ID, selecting the most recent name
 */
export async function fetchACOList(year: number) {
  const startTime = Date.now();
  console.log(`[BUILD] Fetching ACO list for year ${year}...`);

  const config = getSnowflakeConfig();
  const sql = `
    WITH deduplicated AS (
      SELECT
        "aco_id" as ACO_ID,
        FIRST_VALUE("aco_name") OVER (
          PARTITION BY "aco_id"
          ORDER BY "performance_year" DESC
        ) as ACO_NAME,
        FIRST_VALUE("aco_state") OVER (
          PARTITION BY "aco_id"
          ORDER BY "performance_year" DESC
        ) as ACO_STATE,
        FIRST_VALUE("current_track") OVER (
          PARTITION BY "aco_id"
          ORDER BY "performance_year" DESC
        ) as ACO_TRACK,
        ROW_NUMBER() OVER (PARTITION BY "aco_id" ORDER BY "performance_year" DESC) as rn
      FROM ${config.database}.${config.schema}.ACO_PUF
      WHERE "performance_year" <= ${year}
    )
    SELECT
      ACO_ID,
      ACO_NAME,
      COALESCE(ACO_STATE, 'Unknown') as ACO_STATE,
      COALESCE(ACO_TRACK, 'Unknown') as ACO_TRACK
    FROM deduplicated
    WHERE rn = 1
    ORDER BY ACO_NAME
  `;

  const data = await querySnowflake<{
    ACO_ID: string;
    ACO_NAME: string;
    ACO_STATE: string;
    ACO_TRACK: string;
  }>(sql, config);
  const elapsed = Date.now() - startTime;

  console.log(`[BUILD] ✓ ACO list fetched: ${data.length} ACOs (deduplicated) in ${elapsed}ms`);

  return data;
}

/**
 * Fetch all ACO dashboard data for all years
 * Called once at build time
 */
export async function fetchACODashboardData(): Promise<MultiYearDashboardData> {
  const startTime = Date.now();
  console.log('[BUILD] ===== Fetching ACO Dashboard Data =====');

  // First, get all available years
  const years = await fetchAvailableYears();

  if (years.length === 0) {
    console.warn('[BUILD] No performance years found in database');
    return {
      years: [],
      dataByYear: {},
      buildTimestamp: new Date().toISOString(),
    };
  }

  // Fetch data for each year in parallel
  const yearDataPromises = years.map(async (year) => {
    const [summary, rankings] = await Promise.all([
      fetchDashboardSummary(year),
      fetchACORankings(year),
    ]);
    return { year, data: { summary, rankings } };
  });

  const yearDataResults = await Promise.all(yearDataPromises);

  // Build the dataByYear map
  const dataByYear: Record<number, YearlyData> = {};
  let totalRows = 0;

  for (const { year, data } of yearDataResults) {
    dataByYear[year] = data;
    totalRows += data.rankings.length + 1; // +1 for summary
  }

  const elapsed = Date.now() - startTime;

  console.log(`[BUILD] ✓ ACO dashboard data complete: ${years.length} years, ${totalRows} total rows in ${elapsed}ms`);
  console.log(`[BUILD] Years loaded: ${years.join(', ')}`);
  console.log(`[BUILD] Data timestamp: ${new Date().toISOString()}`);

  return {
    years,
    dataByYear,
    buildTimestamp: new Date().toISOString(),
  };
}

/**
 * ACO Participant Interface
 */
export interface ACOParticipant {
  ACO_ID: string;
  ACO_NAME: string;
  PERFORMANCE_YEAR: number;
  PAR_LBN: string; // Participant Legal Business Name
  ACO_NUM?: string;
  AGREEMENT_PERIOD_NUM?: number;
}

/**
 * County Beneficiary Interface
 */
export interface CountyBeneficiary {
  ACO_ID: string;
  YEAR: number;
  STATE_NAME: string;
  STATE_ID: string;
  COUNTY_NAME: string;
  COUNTY_ID: string;
  TOT_AB: number; // Total attributed beneficiaries
  TOT_AB_PSN_YRS: number; // Total person-years
  AB_PSN_YRS_AGDU?: number; // Aged dual
  AB_PSN_YRS_AGND?: number; // Aged non-dual
  AB_PSN_YRS_DIS?: number; // Disabled
  AB_PSN_YRS_ESRD?: number; // ESRD
}

/**
 * Fetch ACO participants for a specific ACO and year
 */
export async function fetchACOParticipants(
  acoId: string,
  year: number
): Promise<ACOParticipant[]> {
  const startTime = Date.now();
  console.log(`[BUILD] Fetching participants for ACO ${acoId}, year ${year}...`);

  const config = getSnowflakeConfig();

  const sql = `
    SELECT DISTINCT
      "ACO_ID" as ACO_ID,
      "ACO_NAME" as ACO_NAME,
      TRY_CAST("PERFORMANCE_YEAR" AS INT) as PERFORMANCE_YEAR,
      "PAR_LBN" as PAR_LBN,
      "ACO_NUM" as ACO_NUM,
      TRY_CAST("AGREEMENT_PERIOD_NUM" AS INT) as AGREEMENT_PERIOD_NUM
    FROM ${config.database}.${config.schema}.ACO_PARTICIPANTS
    WHERE "ACO_ID" = '${acoId}'
      AND TRY_CAST("PERFORMANCE_YEAR" AS INT) = ${year}
    ORDER BY "PAR_LBN"
  `;

  const rows = await querySnowflake<ACOParticipant>(sql, config);

  const elapsed = Date.now() - startTime;
  console.log(`[BUILD] ✓ Participants fetched: ${rows.length} rows in ${elapsed}ms`);

  return rows;
}

/**
 * Fetch county-level beneficiary data for a specific year
 * Note: ACO_BENE_BY_COUNTY uses positional columns ($1, $2, etc.)
 * Column order: $1=AB_PSN_YRS_AGDU, $2=AB_PSN_YRS_AGND, $3=AB_PSN_YRS_DIS, $4=AB_PSN_YRS_ESRD,
 *               $5=ACO_ID, $6=COUNTY_ID, $7=COUNTY_NAME, $8=STATE_ID, $9=STATE_NAME,
 *               $10=TOT_AB, $11=TOT_AB_PSN_YRS, $12=YEAR
 */
export async function fetchCountyBeneficiaries(
  year: number
): Promise<CountyBeneficiary[]> {
  const startTime = Date.now();
  console.log(`[BUILD] Fetching county beneficiaries for year ${year}...`);

  const config = getSnowflakeConfig();

  const sql = `
    SELECT
      $5 as ACO_ID,
      TRY_CAST($12 AS INT) as YEAR,
      $9 as STATE_NAME,
      $8 as STATE_ID,
      $7 as COUNTY_NAME,
      $6 as COUNTY_ID,
      TRY_CAST($10 AS INT) as TOT_AB,
      TRY_CAST($11 AS FLOAT) as TOT_AB_PSN_YRS,
      TRY_CAST($1 AS FLOAT) as AB_PSN_YRS_AGDU,
      TRY_CAST($2 AS FLOAT) as AB_PSN_YRS_AGND,
      TRY_CAST($3 AS FLOAT) as AB_PSN_YRS_DIS,
      TRY_CAST($4 AS FLOAT) as AB_PSN_YRS_ESRD
    FROM ${config.database}.${config.schema}.ACO_BENE_BY_COUNTY
    WHERE TRY_CAST($12 AS INT) = ${year}
    ORDER BY $9, $7
  `;

  const rows = await querySnowflake<CountyBeneficiary>(sql, config);

  const elapsed = Date.now() - startTime;
  console.log(`[BUILD] ✓ County beneficiaries fetched: ${rows.length} rows in ${elapsed}ms`);

  return rows;
}

/**
 * County beneficiary dashboard data - all years
 */
export interface CountyBeneficiaryDashboardData {
  years: number[];
  dataByYear: Record<number, CountyBeneficiary[]>;
  buildTimestamp: string;
}

/**
 * Fetch all county beneficiary data for all years
 */
export async function fetchCountyBeneficiaryData(): Promise<CountyBeneficiaryDashboardData> {
  const startTime = Date.now();
  console.log('[BUILD] ===== Fetching County Beneficiary Data =====');

  const years = await fetchAvailableYears();

  if (years.length === 0) {
    return {
      years: [],
      dataByYear: {},
      buildTimestamp: new Date().toISOString(),
    };
  }

  // Fetch data for each year in parallel
  const yearDataPromises = years.map(async (year) => {
    const data = await fetchCountyBeneficiaries(year);
    return { year, data };
  });

  const yearDataResults = await Promise.all(yearDataPromises);

  const dataByYear: Record<number, CountyBeneficiary[]> = {};
  let totalRows = 0;

  for (const { year, data } of yearDataResults) {
    dataByYear[year] = data;
    totalRows += data.length;
  }

  const elapsed = Date.now() - startTime;
  console.log(`[BUILD] ✓ County beneficiary data complete: ${years.length} years, ${totalRows} total rows in ${elapsed}ms`);

  return {
    years,
    dataByYear,
    buildTimestamp: new Date().toISOString(),
  };
}
