import snowflake from 'snowflake-sdk';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function executeSql(connection: any, sql: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    connection.execute({
      sqlText: sql,
      complete: (err: any, stmt: any, rows: any) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(rows || []);
      },
    });
  });
}

interface LoadResult {
  tableName: string;
  fileName: string;
  success: boolean;
  rowsLoaded: number;
  error?: string;
}

async function loadFile(
  connection: any,
  stageName: string,
  fileName: string,
  tableName: string,
  sourceVintage: string
): Promise<LoadResult> {
  const fullTableName = `raw_cms_partd.${tableName}`;

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Loading: ${fileName}`);
  console.log(`Into table: ${fullTableName}`);
  console.log(`Source vintage: ${sourceVintage}`);
  console.log(`${'='.repeat(60)}\n`);

  try {
    // Extract just the filename without the full S3 path
    const fileNameOnly = fileName.split('/').pop() || fileName;

    const copySQL = `
      COPY INTO ${fullTableName} (
        ${getColumnList(tableName)},
        source_file,
        source_vintage
      )
      FROM (
        SELECT
          ${getColumnSelectors(tableName)},
          '${fileNameOnly}' as source_file,
          '${sourceVintage}' as source_vintage
        FROM '@${stageName}/${fileNameOnly}'
      )
      FILE_FORMAT = (
        TYPE = 'CSV'
        FIELD_DELIMITER = ','
        SKIP_HEADER = 1
        FIELD_OPTIONALLY_ENCLOSED_BY = '"'
        ERROR_ON_COLUMN_COUNT_MISMATCH = FALSE
      )
      ON_ERROR = 'CONTINUE'
      PURGE = FALSE
    `;

    console.log('Executing COPY INTO command...');
    const result = await executeSql(connection, copySQL);

    console.log('✓ COPY complete:');
    console.table(result);

    // Get row count
    const countResult = await executeSql(
      connection,
      `SELECT COUNT(*) as row_count FROM ${fullTableName} WHERE source_file = '${fileNameOnly}'`
    );
    const rowsLoaded = countResult[0]?.ROW_COUNT || 0;

    console.log(`\n✓ Total rows loaded from this file: ${rowsLoaded.toLocaleString()}\n`);

    // Get total table row count
    const totalCountResult = await executeSql(
      connection,
      `SELECT COUNT(*) as row_count FROM ${fullTableName}`
    );
    const totalRows = totalCountResult[0]?.ROW_COUNT || 0;
    console.log(`Total rows in ${fullTableName}: ${totalRows.toLocaleString()}\n`);

    return {
      tableName: fullTableName,
      fileName: fileNameOnly,
      success: true,
      rowsLoaded
    };

  } catch (error: any) {
    console.error(`\n❌ Error loading ${fileName}:`, error.message);
    console.error('Full error:', error);

    return {
      tableName: fullTableName,
      fileName,
      success: false,
      rowsLoaded: 0,
      error: error.message
    };
  }
}

function getColumnList(tableName: string): string {
  const columnMaps: Record<string, string> = {
    'plan_information': 'CONTRACT_ID, PLAN_ID, SEGMENT_ID, CONTRACT_NAME, PLAN_NAME, FORMULARY_ID, PREMIUM, DEDUCTIBLE, MA_REGION_CODE, PDP_REGION_CODE, STATE, COUNTY_CODE, SNP, PLAN_SUPPRESSED_YN',
    'beneficiary_cost': 'CONTRACT_ID, PLAN_ID, SEGMENT_ID, COVERAGE_LEVEL, TIER, DAYS_SUPPLY, COST_TYPE_PREF, COST_AMT_PREF, COST_MIN_AMT_PREF, COST_MAX_AMT_PREF, COST_TYPE_NONPREF, COST_AMT_NONPREF, COST_MIN_AMT_NONPREF, COST_MAX_AMT_NONPREF, COST_TYPE_MAIL_PREF, COST_AMT_MAIL_PREF, COST_MIN_AMT_MAIL_PREF, COST_MAX_AMT_MAIL_PREF, COST_TYPE_MAIL_NONPREF, COST_AMT_MAIL_NONPREF, COST_MIN_AMT_MAIL_NONPREF, COST_MAX_AMT_MAIL_NONPREF, TIER_SPECIALTY_YN, DED_APPLIES_YN',
    'formulary': 'FORMULARY_ID, FORMULARY_VERSION, CONTRACT_YEAR, RXCUI, NDC, TIER_LEVEL_VALUE, QUANTITY_LIMIT_YN, QUANTITY_LIMIT_AMOUNT, QUANTITY_LIMIT_DAYS, PRIOR_AUTHORIZATION_YN, STEP_THERAPY_YN, SELECTED_DRUG_YN',
    'excluded_drugs_formulary': 'CONTRACT_ID, PLAN_ID, RXCUI, TIER, QUANTITY_LIMIT_YN, QUANTITY_LIMIT_AMOUNT, QUANTITY_LIMIT_DAYS, PRIOR_AUTH_YN, STEP_THERAPY_YN, CAPPED_BENEFIT_YN',
    'insulin_beneficiary_cost': 'CONTRACT_ID, PLAN_ID, SEGMENT_ID, TIER, DAYS_SUPPLY, copay_amt_pref_insln, copay_amt_nonpref_insln, copay_amt_mail_pref_insln, copay_amt_mail_nonpref_insln, coin_amt_pref_insln, coin_amt_nonpref_insln, coin_amt_mail_pref_insln, coin_amt_mail_nonpref_insln',
    'indication_formulary': 'CONTRACT_ID, PLAN_ID, RXCUI, DISEASE',
    'geographic_locator': 'COUNTY_CODE, STATENAME, COUNTY, MA_REGION_CODE, MA_REGION, PDP_REGION_CODE, PDP_REGION',
    'drug_pricing': 'CONTRACT_ID, PLAN_ID, SEGMENT_ID, NDC, DAYS_SUPPLY, UNIT_COST',
    'pharmacy_networks': 'CONTRACT_ID, PLAN_ID, SEGMENT_ID, PHARMACY_NUMBER, PHARMACY_ZIPCODE, PREFERRED_STATUS_RETAIL, PREFERRED_STATUS_MAIL, PHARMACY_RETAIL, PHARMACY_MAIL, IN_AREA_FLAG, FLOOR_PRICE, BRAND_DISPENSING_FEE_30, BRAND_DISPENSING_FEE_60, BRAND_DISPENSING_FEE_90, GENERIC_DISPENSING_FEE_30, GENERIC_DISPENSING_FEE_60, GENERIC_DISPENSING_FEE_90, SELECTED_DISPENSING_FEE_30, SELECTED_DISPENSING_FEE_60, SELECTED_DISPENSING_FEE_90',
    'spending_by_drug_annual': 'Brnd_Name, Gnrc_Name, Tot_Mftr, Mftr_Name, Tot_Spndng_2019, Tot_Dsg_Unts_2019, Tot_Clms_2019, Tot_Benes_2019, Avg_Spnd_Per_Dsg_Unt_Wghtd_2019, Avg_Spnd_Per_Clm_2019, Avg_Spnd_Per_Bene_2019, Outlier_Flag_2019, Tot_Spndng_2020, Tot_Dsg_Unts_2020, Tot_Clms_2020, Tot_Benes_2020, Avg_Spnd_Per_Dsg_Unt_Wghtd_2020, Avg_Spnd_Per_Clm_2020, Avg_Spnd_Per_Bene_2020, Outlier_Flag_2020, Tot_Spndng_2021, Tot_Dsg_Unts_2021, Tot_Clms_2021, Tot_Benes_2021, Avg_Spnd_Per_Dsg_Unt_Wghtd_2021, Avg_Spnd_Per_Clm_2021, Avg_Spnd_Per_Bene_2021, Outlier_Flag_2021, Tot_Spndng_2022, Tot_Dsg_Unts_2022, Tot_Clms_2022, Tot_Benes_2022, Avg_Spnd_Per_Dsg_Unt_Wghtd_2022, Avg_Spnd_Per_Clm_2022, Avg_Spnd_Per_Bene_2022, Outlier_Flag_2022, Tot_Spndng_2023, Tot_Dsg_Unts_2023, Tot_Clms_2023, Tot_Benes_2023, Avg_Spnd_Per_Dsg_Unt_Wghtd_2023, Avg_Spnd_Per_Clm_2023, Avg_Spnd_Per_Bene_2023, Outlier_Flag_2023, Chg_Avg_Spnd_Per_Dsg_Unt_22_23, CAGR_Avg_Spnd_Per_Dsg_Unt_19_23',
    'spending_by_drug_quarterly': 'Brnd_Name, Gnrc_Name, Tot_Mftr, Mftr_Name, Year, Tot_Benes, Tot_Clms, Tot_Spndng, Avg_Spnd_Per_Bene, Avg_Spnd_Per_Clm, Drug_Uses'
  };

  return columnMaps[tableName] || '*';
}

function getColumnSelectors(tableName: string): string {
  const columnList = getColumnList(tableName);
  if (columnList === '*') return '*';

  // Generate $1, $2, $3... for each column
  const columnCount = columnList.split(',').length;
  return Array.from({ length: columnCount }, (_, i) => `$${i + 1}`).join(', ');
}

async function main() {
  const config = {
    account: process.env.SNOWFLAKE_ACCOUNT!,
    username: process.env.SNOWFLAKE_USERNAME!,
    password: process.env.SNOWFLAKE_PASSWORD!,
    warehouse: process.env.SNOWFLAKE_WAREHOUSE!,
    database: process.env.SNOWFLAKE_DATABASE || 'DEV_DB',
    role: 'ACCOUNTADMIN',
  };

  console.log('Connecting to Snowflake...');
  console.log(`Account: ${config.account}`);
  console.log(`Database: ${config.database}\n`);

  const connection: any = snowflake.createConnection(config);

  await new Promise<void>((resolve, reject) => {
    connection.connect((err: any) => {
      if (err) {
        console.error('Connection failed:', err);
        reject(err);
      } else {
        console.log('✓ Connected to Snowflake\n');
        resolve();
      }
    });
  });

  const results: LoadResult[] = [];

  try {
    await executeSql(connection, `USE DATABASE ${config.database}`);

    // ======================================
    // Load files from Quarterly Rx Info
    // ======================================
    console.log('\n\n');
    console.log('#'.repeat(60));
    console.log('# LOADING QUARTERLY RX INFO FILES (2025Q4)');
    console.log('#'.repeat(60));

    // 1. Plan Information
    results.push(await loadFile(
      connection,
      'raw_cms_partd.s3_qtrly_rx_stage',
      'plan information  PPUF_2025Q4.txt',
      'plan_information',
      '2025Q4'
    ));

    // 2. Beneficiary Cost
    results.push(await loadFile(
      connection,
      'raw_cms_partd.s3_qtrly_rx_stage',
      'beneficiary cost file  PPUF_2025Q4.txt',
      'beneficiary_cost',
      '2025Q4'
    ));

    // 3. Basic Drugs Formulary
    results.push(await loadFile(
      connection,
      'raw_cms_partd.s3_qtrly_rx_stage',
      'basic drugs formulary file  PPUF_2025Q4.txt',
      'formulary',
      '2025Q4'
    ));

    // 4. Excluded Drugs Formulary
    results.push(await loadFile(
      connection,
      'raw_cms_partd.s3_qtrly_rx_stage',
      'excluded drugs formulary file  PPUF_2025Q4.txt',
      'excluded_drugs_formulary',
      '2025Q4'
    ));

    // 5. Insulin Beneficiary Cost
    results.push(await loadFile(
      connection,
      'raw_cms_partd.s3_qtrly_rx_stage',
      'insulin beneficiary cost file  PPUF_2025Q4.txt',
      'insulin_beneficiary_cost',
      '2025Q4'
    ));

    // 6. Indication Based Coverage
    results.push(await loadFile(
      connection,
      'raw_cms_partd.s3_qtrly_rx_stage',
      'Indication Based Coverage Formulary File  PPUF_2025Q4.txt',
      'indication_formulary',
      '2025Q4'
    ));

    // 7. Geographic Locator
    results.push(await loadFile(
      connection,
      'raw_cms_partd.s3_qtrly_rx_stage',
      'geographic locator file PPUF_2025Q4.txt',
      'geographic_locator',
      '2025Q4'
    ));

    // 8. Drug Pricing (large file - 1.8 GB)
    console.log('\n⚠️  Next file is LARGE (1898 MB) - this may take several minutes...\n');
    results.push(await loadFile(
      connection,
      'raw_cms_partd.s3_qtrly_rx_stage',
      'pricing file PPUF_2025Q4.txt',
      'drug_pricing',
      '2025Q4'
    ));

    // 9. Pharmacy Networks (very large file - 2.4 GB)
    console.log('\n⚠️  Next file is VERY LARGE (2433 MB) - this may take several minutes...\n');
    results.push(await loadFile(
      connection,
      'raw_cms_partd.s3_qtrly_rx_stage',
      'pharmacy networks file  PPUF_2025Q4 part 6.txt',
      'pharmacy_networks',
      '2025Q4'
    ));

    // ======================================
    // Load Annual Spending by Drug
    // ======================================
    console.log('\n\n');
    console.log('#'.repeat(60));
    console.log('# LOADING ANNUAL SPENDING BY DRUG (2023)');
    console.log('#'.repeat(60));

    results.push(await loadFile(
      connection,
      'raw_cms_partd.s3_annual_spending_stage',
      'DSD_PTD_RY25_P04_V10_DY23_BGM.csv',
      'spending_by_drug_annual',
      '2023_annual'
    ));

    // ======================================
    // Load Quarterly Drug Cost
    // ======================================
    console.log('\n\n');
    console.log('#'.repeat(60));
    console.log('# LOADING QUARTERLY DRUG COST (2025 Q2)');
    console.log('#'.repeat(60));

    results.push(await loadFile(
      connection,
      'raw_cms_partd.s3_qtrly_cost_stage',
      'QDD_PTD_RQ2601_P01_V10_DQT2502_20260106.csv',
      'spending_by_drug_quarterly',
      '2025Q2'
    ));

    // ======================================
    // FINAL SUMMARY
    // ======================================
    console.log('\n\n');
    console.log('='.repeat(80));
    console.log('FINAL SUMMARY: All Data Loading Complete');
    console.log('='.repeat(80));
    console.log();

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    console.log(`Total files processed: ${results.length}`);
    console.log(`Successful: ${successful.length}`);
    console.log(`Failed: ${failed.length}`);
    console.log();

    if (successful.length > 0) {
      console.log('Successfully loaded files:');
      successful.forEach(r => {
        console.log(`  ✓ ${r.fileName} → ${r.tableName} (${r.rowsLoaded.toLocaleString()} rows)`);
      });
      console.log();
    }

    if (failed.length > 0) {
      console.log('Failed files:');
      failed.forEach(r => {
        console.log(`  ❌ ${r.fileName} → ${r.tableName}`);
        console.log(`     Error: ${r.error}`);
      });
      console.log();
    }

    console.log('='.repeat(80));
    console.log();

  } catch (error) {
    console.error('Fatal error:', error);
    throw error;
  } finally {
    connection.destroy((err: any) => {
      if (err) {
        console.error('Error closing connection:', err);
      } else {
        console.log('Connection closed.');
      }
    });
  }
}

main().catch(console.error);
