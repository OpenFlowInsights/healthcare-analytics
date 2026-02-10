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
    database: process.env.SNOWFLAKE_DATABASE || 'DEV_DB',
    role: 'ACCOUNTADMIN',
  };

  console.log('Connecting to Snowflake...');
  console.log(`Account: ${config.account}`);
  console.log(`Username: ${config.username}`);
  console.log(`Database: ${config.database}`);
  console.log(`Warehouse: ${config.warehouse}`);

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
    // Use the database
    await executeSql(connection, `USE DATABASE ${config.database}`);
    console.log(`Using database: ${config.database}\n`);

    // ======================================
    // STEP 1: Check for existing storage integration
    // ======================================
    console.log('STEP 1: Checking for existing storage integrations...\n');
    try {
      const integrations = await executeSql(connection, 'SHOW INTEGRATIONS');
      console.log('Available integrations:');
      if (integrations && integrations.length > 0) {
        integrations.forEach((int: any) => {
          console.log(`  - ${int.name} (${int.type})`);
        });
        console.log();
      } else {
        console.log('  No integrations found.\n');
      }
    } catch (err: any) {
      console.log('  Unable to list integrations (may require higher privileges)\n');
    }

    // ======================================
    // STEP 2: Create external stage with storage integration
    // ======================================
    console.log('STEP 2: Creating external stage for RxNorm data...\n');
    console.log('Using existing storage integration: S3_INTEGRATION\n');

    const createStageSQL = `
      CREATE OR REPLACE STAGE raw_rxnorm.s3_rxnorm_stage
      URL = 's3://ofi-healthcare-data/Rx-norm/'
      STORAGE_INTEGRATION = S3_INTEGRATION
      FILE_FORMAT = (
        TYPE = 'CSV'
        FIELD_DELIMITER = '|'
        SKIP_HEADER = 0
        FIELD_OPTIONALLY_ENCLOSED_BY = '"'
        ERROR_ON_COLUMN_COUNT_MISMATCH = FALSE
      )
      COMMENT = 'External stage for RxNorm data from S3'
    `;

    await executeSql(connection, createStageSQL);
    console.log('✓ Created stage: raw_rxnorm.s3_rxnorm_stage\n');

    // ======================================
    // STEP 3: List files in the stage
    // ======================================
    console.log('STEP 3: Listing files in the stage...\n');
    const listFiles = await executeSql(connection, 'LIST @raw_rxnorm.s3_rxnorm_stage');
    console.log('Files found in stage:');
    if (listFiles && listFiles.length > 0) {
      listFiles.forEach((file: any) => {
        console.log(`  - ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
      });
      console.log();
    } else {
      console.log('  No files found in stage.\n');
    }

    // ======================================
    // STEP 4: Load RXNCONSO data
    // ======================================
    console.log('STEP 4: Loading data into raw_rxnorm.rxnconso...\n');

    const copyRxnconsoSQL = `
      COPY INTO raw_rxnorm.rxnconso
      FROM @raw_rxnorm.s3_rxnorm_stage/rrf/RXNCONSO.RRF
      FILE_FORMAT = (
        TYPE = 'CSV'
        FIELD_DELIMITER = '|'
        SKIP_HEADER = 0
        FIELD_OPTIONALLY_ENCLOSED_BY = '"'
        ERROR_ON_COLUMN_COUNT_MISMATCH = FALSE
      )
      ON_ERROR = 'CONTINUE'
      PURGE = FALSE
    `;

    try {
      const copyResult = await executeSql(connection, copyRxnconsoSQL);
      console.log('✓ RXNCONSO load complete:');
      if (copyResult && copyResult.length > 0) {
        console.table(copyResult);
      }
      console.log();
    } catch (err: any) {
      console.error('Error loading RXNCONSO:', err.message);
      console.log('Continuing to next step...\n');
    }

    // Count rows in RXNCONSO
    const rxnconsoCount = await executeSql(connection, 'SELECT COUNT(*) as row_count FROM raw_rxnorm.rxnconso');
    console.log(`Total rows in raw_rxnorm.rxnconso: ${rxnconsoCount[0].ROW_COUNT.toLocaleString()}\n`);

    // ======================================
    // STEP 5: Load RXNSAT data
    // ======================================
    console.log('STEP 5: Loading data into raw_rxnorm.rxnsat...\n');

    const copyRxnsatSQL = `
      COPY INTO raw_rxnorm.rxnsat
      FROM @raw_rxnorm.s3_rxnorm_stage/rrf/RXNSAT.RRF
      FILE_FORMAT = (
        TYPE = 'CSV'
        FIELD_DELIMITER = '|'
        SKIP_HEADER = 0
        FIELD_OPTIONALLY_ENCLOSED_BY = '"'
        ERROR_ON_COLUMN_COUNT_MISMATCH = FALSE
      )
      ON_ERROR = 'CONTINUE'
      PURGE = FALSE
    `;

    try {
      const copyResult = await executeSql(connection, copyRxnsatSQL);
      console.log('✓ RXNSAT load complete:');
      if (copyResult && copyResult.length > 0) {
        console.table(copyResult);
      }
      console.log();
    } catch (err: any) {
      console.error('Error loading RXNSAT:', err.message);
      console.log('Continuing to verification step...\n');
    }

    // Count rows in RXNSAT
    const rxnsatCount = await executeSql(connection, 'SELECT COUNT(*) as row_count FROM raw_rxnorm.rxnsat');
    console.log(`Total rows in raw_rxnorm.rxnsat: ${rxnsatCount[0].ROW_COUNT.toLocaleString()}\n`);

    // ======================================
    // VERIFICATION QUERIES
    // ======================================
    console.log('======================================');
    console.log('VERIFICATION QUERIES');
    console.log('======================================\n');

    // Count of rows in rxnsat where ATN='NDC'
    console.log('Counting NDC crosswalk records in rxnsat...');
    const ndcCount = await executeSql(connection, `
      SELECT COUNT(*) as ndc_count
      FROM raw_rxnorm.rxnsat
      WHERE ATN = 'NDC'
    `);
    console.log(`Rows in rxnsat where ATN='NDC': ${ndcCount[0].NDC_COUNT.toLocaleString()}`);

    // Sample NDC records
    console.log('\nSample NDC crosswalk records:');
    const ndcSample = await executeSql(connection, `
      SELECT RXCUI, CODE, ATN, SAV
      FROM raw_rxnorm.rxnsat
      WHERE ATN = 'NDC'
      LIMIT 5
    `);
    console.table(ndcSample);

    // Count of distinct RXCUI in rxnconso where SAB='RXNORM'
    console.log('\nCounting distinct RXCUI in rxnconso where SAB=\'RXNORM\'...');
    const rxcuiCount = await executeSql(connection, `
      SELECT COUNT(DISTINCT RXCUI) as distinct_rxcui_count
      FROM raw_rxnorm.rxnconso
      WHERE SAB = 'RXNORM'
    `);
    console.log(`Distinct RXCUI in rxnconso where SAB='RXNORM': ${rxcuiCount[0].DISTINCT_RXCUI_COUNT.toLocaleString()}`);

    // Sample RXNORM concepts
    console.log('\nSample RXNORM concepts:');
    const rxnormSample = await executeSql(connection, `
      SELECT RXCUI, TTY, STR
      FROM raw_rxnorm.rxnconso
      WHERE SAB = 'RXNORM'
      LIMIT 5
    `);
    console.table(rxnormSample);

    // Additional verification: Check for various source vocabularies
    console.log('\nSource vocabularies (SAB) in rxnconso:');
    const sabCount = await executeSql(connection, `
      SELECT SAB, COUNT(*) as count
      FROM raw_rxnorm.rxnconso
      GROUP BY SAB
      ORDER BY count DESC
      LIMIT 10
    `);
    console.table(sabCount);

    console.log('\n✓ RxNorm data load complete!\n');

  } catch (error) {
    console.error('Error:', error);
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
