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

interface StageFile {
  name: string;
  size: number;
  lastModified: string;
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
  console.log(`Database: ${config.database}`);
  console.log(`Warehouse: ${config.warehouse}\n`);

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
    await executeSql(connection, `USE DATABASE ${config.database}`);

    // ======================================
    // STAGE 1: Quarterly Rx Info
    // ======================================
    console.log('='.repeat(60));
    console.log('STAGE 1: Quarterly Rx Info (Formulary Data)');
    console.log('='.repeat(60));
    console.log();

    console.log('Creating stage for Quarterly Rx Info...');
    await executeSql(connection, `
      CREATE OR REPLACE STAGE raw_cms_partd.s3_qtrly_rx_stage
      URL = 's3://ofi-healthcare-data/Qtrly_Rx_Info/'
      STORAGE_INTEGRATION = S3_INTEGRATION
      FILE_FORMAT = (
        TYPE = 'CSV'
        FIELD_DELIMITER = ','
        SKIP_HEADER = 1
        FIELD_OPTIONALLY_ENCLOSED_BY = '"'
      )
      COMMENT = 'External stage for CMS Part D Quarterly Rx Info'
    `);
    console.log('✓ Created stage: raw_cms_partd.s3_qtrly_rx_stage\n');

    console.log('Listing files in Quarterly Rx Info stage...');
    const qtrlyFiles = await executeSql(connection, 'LIST @raw_cms_partd.s3_qtrly_rx_stage');
    console.log(`Found ${qtrlyFiles.length} files:\n`);
    qtrlyFiles.forEach((file: any) => {
      console.log(`  - ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
    });
    console.log();

    // ======================================
    // STAGE 2: Annual Spending by Drug
    // ======================================
    console.log('='.repeat(60));
    console.log('STAGE 2: Medicare Part D Spending by Drug (Annual)');
    console.log('='.repeat(60));
    console.log();

    console.log('Creating stage for Annual Spending...');
    await executeSql(connection, `
      CREATE OR REPLACE STAGE raw_cms_partd.s3_annual_spending_stage
      URL = 's3://ofi-healthcare-data/Medicare-Part-D-Spending-By-Drug-Annual/'
      STORAGE_INTEGRATION = S3_INTEGRATION
      FILE_FORMAT = (
        TYPE = 'CSV'
        FIELD_DELIMITER = ','
        SKIP_HEADER = 1
        FIELD_OPTIONALLY_ENCLOSED_BY = '"'
      )
      COMMENT = 'External stage for CMS Part D Annual Spending by Drug'
    `);
    console.log('✓ Created stage: raw_cms_partd.s3_annual_spending_stage\n');

    console.log('Listing files in Annual Spending stage...');
    const annualFiles = await executeSql(connection, 'LIST @raw_cms_partd.s3_annual_spending_stage');
    console.log(`Found ${annualFiles.length} files:\n`);
    annualFiles.forEach((file: any) => {
      console.log(`  - ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
    });
    console.log();

    // ======================================
    // STAGE 3: Quarterly Drug Cost
    // ======================================
    console.log('='.repeat(60));
    console.log('STAGE 3: Part D Drug Cost (Quarterly)');
    console.log('='.repeat(60));
    console.log();

    console.log('Creating stage for Quarterly Drug Cost...');
    await executeSql(connection, `
      CREATE OR REPLACE STAGE raw_cms_partd.s3_qtrly_cost_stage
      URL = 's3://ofi-healthcare-data/Part_D_Drug_Cost_Quarterly/'
      STORAGE_INTEGRATION = S3_INTEGRATION
      FILE_FORMAT = (
        TYPE = 'CSV'
        FIELD_DELIMITER = ','
        SKIP_HEADER = 1
        FIELD_OPTIONALLY_ENCLOSED_BY = '"'
      )
      COMMENT = 'External stage for CMS Part D Quarterly Drug Cost'
    `);
    console.log('✓ Created stage: raw_cms_partd.s3_qtrly_cost_stage\n');

    console.log('Listing files in Quarterly Drug Cost stage...');
    const qtrlyFiles2 = await executeSql(connection, 'LIST @raw_cms_partd.s3_qtrly_cost_stage');
    console.log(`Found ${qtrlyFiles2.length} files:\n`);
    qtrlyFiles2.forEach((file: any) => {
      console.log(`  - ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
    });
    console.log();

    // ======================================
    // SUMMARY
    // ======================================
    console.log('='.repeat(60));
    console.log('SUMMARY: All stages created and files visible');
    console.log('='.repeat(60));
    console.log();
    console.log('Next steps:');
    console.log('1. Review the files listed above');
    console.log('2. Map each file to the appropriate table');
    console.log('3. Load data file by file');
    console.log();
    console.log('Ready to proceed with data loading!');
    console.log();

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
