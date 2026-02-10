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

async function main() {
  const config = {
    account: process.env.SNOWFLAKE_ACCOUNT!,
    username: process.env.SNOWFLAKE_USERNAME!,
    password: process.env.SNOWFLAKE_PASSWORD!,
    warehouse: process.env.SNOWFLAKE_WAREHOUSE!,
    role: 'ACCOUNTADMIN', // Try using ACCOUNTADMIN role for schema creation
  };

  console.log('Connecting to Snowflake...');
  console.log(`Account: ${config.account}`);
  console.log(`Username: ${config.username}`);
  console.log(`Warehouse: ${config.warehouse}`);
  console.log(`Role: ${config.role}`);

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

  try {
    // Check current role and database
    console.log('Checking current role and database...');
    const currentInfo = await executeSql(connection, 'SELECT CURRENT_ROLE() as ROLE, CURRENT_DATABASE() as DB');
    console.log(`Current role: ${currentInfo[0]?.ROLE}`);
    console.log(`Current database: ${currentInfo[0]?.DB}`);

    // Show available databases
    console.log('\nChecking available databases...');
    const databases = await executeSql(connection, 'SHOW DATABASES');
    console.log('Available databases:');
    databases.forEach((db: any) => {
      console.log(`  - ${db.name}`);
    });

    // Try to use ANALYTICS database, fall back to current
    let dbName = 'ANALYTICS';
    try {
      await executeSql(connection, `USE DATABASE ${dbName}`);
      console.log(`\nUsing database: ${dbName}\n`);
    } catch (err: any) {
      console.log(`\nCannot use ANALYTICS database, trying current database...`);
      dbName = currentInfo[0]?.DB;
      if (dbName) {
        await executeSql(connection, `USE DATABASE ${dbName}`);
        console.log(`Using database: ${dbName}\n`);
      } else {
        throw new Error('No database available');
      }
    }

    // Create schemas
    console.log('Creating schemas...');
    await executeSql(connection, 'CREATE SCHEMA IF NOT EXISTS raw_rxnorm');
    console.log('✓ Created schema: raw_rxnorm');

    await executeSql(connection, 'CREATE SCHEMA IF NOT EXISTS raw_cms_partd');
    console.log('✓ Created schema: raw_cms_partd\n');

    // ======================================
    // RXNORM TABLES
    // ======================================

    console.log('Creating RxNorm tables...\n');

    // RXNCONSO table
    console.log('Creating raw_rxnorm.rxnconso...');
    await executeSql(connection, `
      CREATE OR REPLACE TABLE raw_rxnorm.rxnconso (
        RXCUI VARCHAR,
        LAT VARCHAR,
        TS VARCHAR,
        LUI VARCHAR,
        STT VARCHAR,
        SUI VARCHAR,
        ISPREF VARCHAR,
        RXAUI VARCHAR,
        SAUI VARCHAR,
        SCUI VARCHAR,
        SDUI VARCHAR,
        SAB VARCHAR,
        TTY VARCHAR,
        CODE VARCHAR,
        STR VARCHAR,
        SRL VARCHAR,
        SUPPRESS VARCHAR,
        CVF VARCHAR
      )
    `);
    console.log('✓ Created raw_rxnorm.rxnconso');

    const rxnconsoDesc = await executeSql(connection, 'DESCRIBE TABLE raw_rxnorm.rxnconso');
    console.log('\nDESCRIBE TABLE raw_rxnorm.rxnconso:');
    console.table(rxnconsoDesc);

    // RXNSAT table
    console.log('\nCreating raw_rxnorm.rxnsat...');
    await executeSql(connection, `
      CREATE OR REPLACE TABLE raw_rxnorm.rxnsat (
        RXCUI VARCHAR,
        LUI VARCHAR,
        SUI VARCHAR,
        RXAUI VARCHAR,
        STYPE VARCHAR,
        CODE VARCHAR,
        ATUI VARCHAR,
        SATUI VARCHAR,
        ATN VARCHAR,
        SAV VARCHAR,
        ATN_VAL VARCHAR,
        SUPPRESS VARCHAR,
        CVF VARCHAR
      )
    `);
    console.log('✓ Created raw_rxnorm.rxnsat');

    const rxnsatDesc = await executeSql(connection, 'DESCRIBE TABLE raw_rxnorm.rxnsat');
    console.log('\nDESCRIBE TABLE raw_rxnorm.rxnsat:');
    console.table(rxnsatDesc);

    // ======================================
    // CMS PART D TABLES
    // ======================================

    console.log('\n\nCreating CMS Part D tables...\n');

    // 1. Plan Information
    console.log('Creating raw_cms_partd.plan_information...');
    await executeSql(connection, `
      CREATE OR REPLACE TABLE raw_cms_partd.plan_information (
        CONTRACT_ID VARCHAR,
        PLAN_ID VARCHAR,
        SEGMENT_ID VARCHAR,
        CONTRACT_NAME VARCHAR,
        PLAN_NAME VARCHAR,
        FORMULARY_ID VARCHAR,
        PREMIUM VARCHAR,
        DEDUCTIBLE VARCHAR,
        MA_REGION_CODE VARCHAR,
        PDP_REGION_CODE VARCHAR,
        STATE VARCHAR,
        COUNTY_CODE VARCHAR,
        SNP VARCHAR,
        PLAN_SUPPRESSED_YN VARCHAR,
        source_file VARCHAR,
        source_vintage VARCHAR,
        loaded_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
      )
    `);
    console.log('✓ Created raw_cms_partd.plan_information');

    const planInfoDesc = await executeSql(connection, 'DESCRIBE TABLE raw_cms_partd.plan_information');
    console.log('\nDESCRIBE TABLE raw_cms_partd.plan_information:');
    console.table(planInfoDesc);

    // 2. Beneficiary Cost
    console.log('\n\nCreating raw_cms_partd.beneficiary_cost...');
    await executeSql(connection, `
      CREATE OR REPLACE TABLE raw_cms_partd.beneficiary_cost (
        CONTRACT_ID VARCHAR,
        PLAN_ID VARCHAR,
        SEGMENT_ID VARCHAR,
        COVERAGE_LEVEL VARCHAR,
        TIER VARCHAR,
        DAYS_SUPPLY VARCHAR,
        COST_TYPE_PREF VARCHAR,
        COST_AMT_PREF VARCHAR,
        COST_MIN_AMT_PREF VARCHAR,
        COST_MAX_AMT_PREF VARCHAR,
        COST_TYPE_NONPREF VARCHAR,
        COST_AMT_NONPREF VARCHAR,
        COST_MIN_AMT_NONPREF VARCHAR,
        COST_MAX_AMT_NONPREF VARCHAR,
        COST_TYPE_MAIL_PREF VARCHAR,
        COST_AMT_MAIL_PREF VARCHAR,
        COST_MIN_AMT_MAIL_PREF VARCHAR,
        COST_MAX_AMT_MAIL_PREF VARCHAR,
        COST_TYPE_MAIL_NONPREF VARCHAR,
        COST_AMT_MAIL_NONPREF VARCHAR,
        COST_MIN_AMT_MAIL_NONPREF VARCHAR,
        COST_MAX_AMT_MAIL_NONPREF VARCHAR,
        TIER_SPECIALTY_YN VARCHAR,
        DED_APPLIES_YN VARCHAR,
        source_file VARCHAR,
        source_vintage VARCHAR,
        loaded_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
      )
    `);
    console.log('✓ Created raw_cms_partd.beneficiary_cost');

    const beneCostDesc = await executeSql(connection, 'DESCRIBE TABLE raw_cms_partd.beneficiary_cost');
    console.log('\nDESCRIBE TABLE raw_cms_partd.beneficiary_cost:');
    console.table(beneCostDesc);

    // 3. Formulary (Basic Drugs)
    console.log('\n\nCreating raw_cms_partd.formulary...');
    await executeSql(connection, `
      CREATE OR REPLACE TABLE raw_cms_partd.formulary (
        FORMULARY_ID VARCHAR,
        FORMULARY_VERSION VARCHAR,
        CONTRACT_YEAR VARCHAR,
        RXCUI VARCHAR,
        NDC VARCHAR,
        TIER_LEVEL_VALUE VARCHAR,
        QUANTITY_LIMIT_YN VARCHAR,
        QUANTITY_LIMIT_AMOUNT VARCHAR,
        QUANTITY_LIMIT_DAYS VARCHAR,
        PRIOR_AUTHORIZATION_YN VARCHAR,
        STEP_THERAPY_YN VARCHAR,
        SELECTED_DRUG_YN VARCHAR,
        source_file VARCHAR,
        source_vintage VARCHAR,
        loaded_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
      )
    `);
    console.log('✓ Created raw_cms_partd.formulary');

    const formularyDesc = await executeSql(connection, 'DESCRIBE TABLE raw_cms_partd.formulary');
    console.log('\nDESCRIBE TABLE raw_cms_partd.formulary:');
    console.table(formularyDesc);

    // 4. Excluded Drugs Formulary
    console.log('\n\nCreating raw_cms_partd.excluded_drugs_formulary...');
    await executeSql(connection, `
      CREATE OR REPLACE TABLE raw_cms_partd.excluded_drugs_formulary (
        CONTRACT_ID VARCHAR,
        PLAN_ID VARCHAR,
        RXCUI VARCHAR,
        TIER VARCHAR,
        QUANTITY_LIMIT_YN VARCHAR,
        QUANTITY_LIMIT_AMOUNT VARCHAR,
        QUANTITY_LIMIT_DAYS VARCHAR,
        PRIOR_AUTH_YN VARCHAR,
        STEP_THERAPY_YN VARCHAR,
        CAPPED_BENEFIT_YN VARCHAR,
        source_file VARCHAR,
        source_vintage VARCHAR,
        loaded_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
      )
    `);
    console.log('✓ Created raw_cms_partd.excluded_drugs_formulary');

    const excludedDesc = await executeSql(connection, 'DESCRIBE TABLE raw_cms_partd.excluded_drugs_formulary');
    console.log('\nDESCRIBE TABLE raw_cms_partd.excluded_drugs_formulary:');
    console.table(excludedDesc);

    // 5. Insulin Beneficiary Cost
    console.log('\n\nCreating raw_cms_partd.insulin_beneficiary_cost...');
    await executeSql(connection, `
      CREATE OR REPLACE TABLE raw_cms_partd.insulin_beneficiary_cost (
        CONTRACT_ID VARCHAR,
        PLAN_ID VARCHAR,
        SEGMENT_ID VARCHAR,
        TIER VARCHAR,
        DAYS_SUPPLY VARCHAR,
        copay_amt_pref_insln VARCHAR,
        copay_amt_nonpref_insln VARCHAR,
        copay_amt_mail_pref_insln VARCHAR,
        copay_amt_mail_nonpref_insln VARCHAR,
        coin_amt_pref_insln VARCHAR,
        coin_amt_nonpref_insln VARCHAR,
        coin_amt_mail_pref_insln VARCHAR,
        coin_amt_mail_nonpref_insln VARCHAR,
        source_file VARCHAR,
        source_vintage VARCHAR,
        loaded_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
      )
    `);
    console.log('✓ Created raw_cms_partd.insulin_beneficiary_cost');

    const insulinDesc = await executeSql(connection, 'DESCRIBE TABLE raw_cms_partd.insulin_beneficiary_cost');
    console.log('\nDESCRIBE TABLE raw_cms_partd.insulin_beneficiary_cost:');
    console.table(insulinDesc);

    // 6. Indication Based Coverage Formulary
    console.log('\n\nCreating raw_cms_partd.indication_formulary...');
    await executeSql(connection, `
      CREATE OR REPLACE TABLE raw_cms_partd.indication_formulary (
        CONTRACT_ID VARCHAR,
        PLAN_ID VARCHAR,
        RXCUI VARCHAR,
        DISEASE VARCHAR,
        source_file VARCHAR,
        source_vintage VARCHAR,
        loaded_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
      )
    `);
    console.log('✓ Created raw_cms_partd.indication_formulary');

    const indicationDesc = await executeSql(connection, 'DESCRIBE TABLE raw_cms_partd.indication_formulary');
    console.log('\nDESCRIBE TABLE raw_cms_partd.indication_formulary:');
    console.table(indicationDesc);

    // 7. Geographic Locator
    console.log('\n\nCreating raw_cms_partd.geographic_locator...');
    await executeSql(connection, `
      CREATE OR REPLACE TABLE raw_cms_partd.geographic_locator (
        COUNTY_CODE VARCHAR,
        STATENAME VARCHAR,
        COUNTY VARCHAR,
        MA_REGION_CODE VARCHAR,
        MA_REGION VARCHAR,
        PDP_REGION_CODE VARCHAR,
        PDP_REGION VARCHAR,
        source_file VARCHAR,
        source_vintage VARCHAR,
        loaded_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
      )
    `);
    console.log('✓ Created raw_cms_partd.geographic_locator');

    const geoDesc = await executeSql(connection, 'DESCRIBE TABLE raw_cms_partd.geographic_locator');
    console.log('\nDESCRIBE TABLE raw_cms_partd.geographic_locator:');
    console.table(geoDesc);

    // 8. Drug Pricing
    console.log('\n\nCreating raw_cms_partd.drug_pricing...');
    await executeSql(connection, `
      CREATE OR REPLACE TABLE raw_cms_partd.drug_pricing (
        CONTRACT_ID VARCHAR,
        PLAN_ID VARCHAR,
        SEGMENT_ID VARCHAR,
        NDC VARCHAR,
        DAYS_SUPPLY VARCHAR,
        UNIT_COST VARCHAR,
        source_file VARCHAR,
        source_vintage VARCHAR,
        loaded_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
      )
    `);
    console.log('✓ Created raw_cms_partd.drug_pricing');

    const pricingDesc = await executeSql(connection, 'DESCRIBE TABLE raw_cms_partd.drug_pricing');
    console.log('\nDESCRIBE TABLE raw_cms_partd.drug_pricing:');
    console.table(pricingDesc);

    // 9. Pharmacy Networks
    console.log('\n\nCreating raw_cms_partd.pharmacy_networks...');
    await executeSql(connection, `
      CREATE OR REPLACE TABLE raw_cms_partd.pharmacy_networks (
        CONTRACT_ID VARCHAR,
        PLAN_ID VARCHAR,
        SEGMENT_ID VARCHAR,
        PHARMACY_NUMBER VARCHAR,
        PHARMACY_ZIPCODE VARCHAR,
        PREFERRED_STATUS_RETAIL VARCHAR,
        PREFERRED_STATUS_MAIL VARCHAR,
        PHARMACY_RETAIL VARCHAR,
        PHARMACY_MAIL VARCHAR,
        IN_AREA_FLAG VARCHAR,
        FLOOR_PRICE VARCHAR,
        BRAND_DISPENSING_FEE_30 VARCHAR,
        BRAND_DISPENSING_FEE_60 VARCHAR,
        BRAND_DISPENSING_FEE_90 VARCHAR,
        GENERIC_DISPENSING_FEE_30 VARCHAR,
        GENERIC_DISPENSING_FEE_60 VARCHAR,
        GENERIC_DISPENSING_FEE_90 VARCHAR,
        SELECTED_DISPENSING_FEE_30 VARCHAR,
        SELECTED_DISPENSING_FEE_60 VARCHAR,
        SELECTED_DISPENSING_FEE_90 VARCHAR,
        source_file VARCHAR,
        source_vintage VARCHAR,
        loaded_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
      )
    `);
    console.log('✓ Created raw_cms_partd.pharmacy_networks');

    const pharmacyDesc = await executeSql(connection, 'DESCRIBE TABLE raw_cms_partd.pharmacy_networks');
    console.log('\nDESCRIBE TABLE raw_cms_partd.pharmacy_networks:');
    console.table(pharmacyDesc);

    // 10. Spending by Drug - Annual
    console.log('\n\nCreating raw_cms_partd.spending_by_drug_annual...');
    await executeSql(connection, `
      CREATE OR REPLACE TABLE raw_cms_partd.spending_by_drug_annual (
        Brnd_Name VARCHAR,
        Gnrc_Name VARCHAR,
        Tot_Mftr VARCHAR,
        Mftr_Name VARCHAR,
        Tot_Spndng_2019 VARCHAR,
        Tot_Dsg_Unts_2019 VARCHAR,
        Tot_Clms_2019 VARCHAR,
        Tot_Benes_2019 VARCHAR,
        Avg_Spnd_Per_Dsg_Unt_Wghtd_2019 VARCHAR,
        Avg_Spnd_Per_Clm_2019 VARCHAR,
        Avg_Spnd_Per_Bene_2019 VARCHAR,
        Outlier_Flag_2019 VARCHAR,
        Tot_Spndng_2020 VARCHAR,
        Tot_Dsg_Unts_2020 VARCHAR,
        Tot_Clms_2020 VARCHAR,
        Tot_Benes_2020 VARCHAR,
        Avg_Spnd_Per_Dsg_Unt_Wghtd_2020 VARCHAR,
        Avg_Spnd_Per_Clm_2020 VARCHAR,
        Avg_Spnd_Per_Bene_2020 VARCHAR,
        Outlier_Flag_2020 VARCHAR,
        Tot_Spndng_2021 VARCHAR,
        Tot_Dsg_Unts_2021 VARCHAR,
        Tot_Clms_2021 VARCHAR,
        Tot_Benes_2021 VARCHAR,
        Avg_Spnd_Per_Dsg_Unt_Wghtd_2021 VARCHAR,
        Avg_Spnd_Per_Clm_2021 VARCHAR,
        Avg_Spnd_Per_Bene_2021 VARCHAR,
        Outlier_Flag_2021 VARCHAR,
        Tot_Spndng_2022 VARCHAR,
        Tot_Dsg_Unts_2022 VARCHAR,
        Tot_Clms_2022 VARCHAR,
        Tot_Benes_2022 VARCHAR,
        Avg_Spnd_Per_Dsg_Unt_Wghtd_2022 VARCHAR,
        Avg_Spnd_Per_Clm_2022 VARCHAR,
        Avg_Spnd_Per_Bene_2022 VARCHAR,
        Outlier_Flag_2022 VARCHAR,
        Tot_Spndng_2023 VARCHAR,
        Tot_Dsg_Unts_2023 VARCHAR,
        Tot_Clms_2023 VARCHAR,
        Tot_Benes_2023 VARCHAR,
        Avg_Spnd_Per_Dsg_Unt_Wghtd_2023 VARCHAR,
        Avg_Spnd_Per_Clm_2023 VARCHAR,
        Avg_Spnd_Per_Bene_2023 VARCHAR,
        Outlier_Flag_2023 VARCHAR,
        Chg_Avg_Spnd_Per_Dsg_Unt_22_23 VARCHAR,
        CAGR_Avg_Spnd_Per_Dsg_Unt_19_23 VARCHAR,
        source_file VARCHAR,
        source_vintage VARCHAR,
        loaded_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
      )
    `);
    console.log('✓ Created raw_cms_partd.spending_by_drug_annual');

    const spendingAnnualDesc = await executeSql(connection, 'DESCRIBE TABLE raw_cms_partd.spending_by_drug_annual');
    console.log('\nDESCRIBE TABLE raw_cms_partd.spending_by_drug_annual:');
    console.table(spendingAnnualDesc);

    // 11. Spending by Drug - Quarterly
    console.log('\n\nCreating raw_cms_partd.spending_by_drug_quarterly...');
    await executeSql(connection, `
      CREATE OR REPLACE TABLE raw_cms_partd.spending_by_drug_quarterly (
        Brnd_Name VARCHAR,
        Gnrc_Name VARCHAR,
        Tot_Mftr VARCHAR,
        Mftr_Name VARCHAR,
        Year VARCHAR,
        Tot_Benes VARCHAR,
        Tot_Clms VARCHAR,
        Tot_Spndng VARCHAR,
        Avg_Spnd_Per_Bene VARCHAR,
        Avg_Spnd_Per_Clm VARCHAR,
        Drug_Uses VARCHAR,
        source_file VARCHAR,
        source_vintage VARCHAR,
        loaded_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
      )
    `);
    console.log('✓ Created raw_cms_partd.spending_by_drug_quarterly');

    const spendingQuarterlyDesc = await executeSql(connection, 'DESCRIBE TABLE raw_cms_partd.spending_by_drug_quarterly');
    console.log('\nDESCRIBE TABLE raw_cms_partd.spending_by_drug_quarterly:');
    console.table(spendingQuarterlyDesc);

    console.log('\n\n✓ All schemas and tables created successfully!');

  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    connection.destroy((err: any) => {
      if (err) {
        console.error('Error closing connection:', err);
      } else {
        console.log('\nConnection closed.');
      }
    });
  }
}

main().catch(console.error);
