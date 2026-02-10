import snowflake from 'snowflake-sdk';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function executeSql(connection: any, sql: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    connection.execute({
      sqlText: sql,
      complete: (err: any, stmt: any, rows: any) => {
        if (err) reject(err);
        else resolve(rows || []);
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
    database: 'DEV_DB',
    role: 'ACCOUNTADMIN',
  };

  console.log('Connecting to Snowflake...\n');

  const connection = snowflake.createConnection(config);

  await new Promise<void>((resolve, reject) => {
    connection.connect((err) => {
      if (err) reject(err);
      else {
        console.log('✓ Connected\n');
        resolve();
      }
    });
  });

  try {
    await executeSql(connection, `USE DATABASE ${config.database}`);

    console.log('='.repeat(80));
    console.log('STEP 1: Truncating incorrectly loaded tables');
    console.log('='.repeat(80));
    console.log();

    const tablesToTruncate = [
      'plan_information',
      'beneficiary_cost',
      'formulary',
      'excluded_drugs_formulary',
      'insulin_beneficiary_cost',
      'indication_formulary',
      'geographic_locator',
      'drug_pricing',
      'pharmacy_networks'
    ];

    for (const table of tablesToTruncate) {
      console.log(`Truncating raw_cms_partd.${table}...`);
      await executeSql(connection, `TRUNCATE TABLE raw_cms_partd.${table}`);
      console.log(`✓ Truncated\n`);
    }

    console.log('='.repeat(80));
    console.log('STEP 2: Recreating stage with correct delimiter (PIPE)');
    console.log('='.repeat(80));
    console.log();

    await executeSql(connection, `
      CREATE OR REPLACE STAGE raw_cms_partd.s3_qtrly_rx_stage
      URL = 's3://ofi-healthcare-data/Qtrly_Rx_Info/'
      STORAGE_INTEGRATION = S3_INTEGRATION
      FILE_FORMAT = (
        TYPE = 'CSV'
        FIELD_DELIMITER = '|'
        SKIP_HEADER = 1
        FIELD_OPTIONALLY_ENCLOSED_BY = NONE
        ERROR_ON_COLUMN_COUNT_MISMATCH = FALSE
      )
      COMMENT = 'External stage for CMS Part D Quarterly Rx Info - PIPE delimited'
    `);
    console.log('✓ Recreated raw_cms_partd.s3_qtrly_rx_stage with PIPE delimiter\n');

    console.log('='.repeat(80));
    console.log('STEP 3: Reloading data with correct format');
    console.log('='.repeat(80));
    console.log();

    // Helper function to load a file
    async function loadPipeDelimitedFile(
      fileName: string,
      tableName: string,
      sourceVintage: string
    ) {
      console.log(`\nLoading: ${fileName} → ${tableName}`);

      const fileNameOnly = fileName.split('/').pop() || fileName;

      try {
        const result = await executeSql(connection, `
          COPY INTO raw_cms_partd.${tableName}
          FROM '@raw_cms_partd.s3_qtrly_rx_stage/${fileNameOnly}'
          FILE_FORMAT = (
            TYPE = 'CSV'
            FIELD_DELIMITER = '|'
            SKIP_HEADER = 1
            FIELD_OPTIONALLY_ENCLOSED_BY = NONE
            ERROR_ON_COLUMN_COUNT_MISMATCH = FALSE
          )
          ON_ERROR = 'CONTINUE'
        `);

        console.table(result);

        const count = await executeSql(connection,
          `SELECT COUNT(*) as count FROM raw_cms_partd.${tableName}`
        );
        console.log(`Total rows in table: ${count[0].COUNT.toLocaleString()}\n`);

        return { table: tableName, success: true, count: count[0].COUNT };
      } catch (err: any) {
        console.error(`Error: ${err.message}\n`);
        return { table: tableName, success: false, error: err.message };
      }
    }

    const results = [];

    // Load all files with pipe delimiter
    results.push(await loadPipeDelimitedFile('plan information  PPUF_2025Q4.txt', 'plan_information', '2025Q4'));
    results.push(await loadPipeDelimitedFile('beneficiary cost file  PPUF_2025Q4.txt', 'beneficiary_cost', '2025Q4'));
    results.push(await loadPipeDelimitedFile('basic drugs formulary file  PPUF_2025Q4.txt', 'formulary', '2025Q4'));
    results.push(await loadPipeDelimitedFile('excluded drugs formulary file  PPUF_2025Q4.txt', 'excluded_drugs_formulary', '2025Q4'));
    results.push(await loadPipeDelimitedFile('insulin beneficiary cost file  PPUF_2025Q4.txt', 'insulin_beneficiary_cost', '2025Q4'));
    results.push(await loadPipeDelimitedFile('Indication Based Coverage Formulary File  PPUF_2025Q4.txt', 'indication_formulary', '2025Q4'));
    results.push(await loadPipeDelimitedFile('geographic locator file PPUF_2025Q4.txt', 'geographic_locator', '2025Q4'));

    console.log('\n⚠️  Next: LARGE file (1898 MB) - may take a few minutes...\n');
    results.push(await loadPipeDelimitedFile('pricing file PPUF_2025Q4.txt', 'drug_pricing', '2025Q4'));

    console.log('\n⚠️  Next: VERY LARGE file (2433 MB) - may take several minutes...\n');
    results.push(await loadPipeDelimitedFile('pharmacy networks file  PPUF_2025Q4 part 6.txt', 'pharmacy_networks', '2025Q4'));

    console.log('\n' + '='.repeat(80));
    console.log('SUMMARY');
    console.log('='.repeat(80));
    console.log();

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    console.log(`Successful: ${successful.length}`);
    console.log(`Failed: ${failed.length}\n`);

    successful.forEach(r => {
      console.log(`✓ ${r.table}: ${r.count?.toLocaleString()} rows`);
    });

    if (failed.length > 0) {
      console.log('\nFailed:');
      failed.forEach(r => {
        console.log(`❌ ${r.table}: ${r.error}`);
      });
    }

  } catch (error) {
    console.error('Fatal error:', error);
    throw error;
  } finally {
    connection.destroy((err: any) => {
      if (err) console.error('Error closing connection:', err);
      else console.log('\nConnection closed.');
    });
  }
}

main().catch(console.error);
