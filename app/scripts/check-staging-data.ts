import snowflake from 'snowflake-sdk';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env.local') });

async function executeSql(connection: snowflake.Connection, sqlText: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    connection.execute({
      sqlText,
      complete: (err, stmt, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      }
    });
  });
}

async function checkStagingData() {
  const connection = snowflake.createConnection({
    account: process.env.SNOWFLAKE_ACCOUNT!,
    username: process.env.SNOWFLAKE_USERNAME!,
    password: process.env.SNOWFLAKE_PASSWORD!,
    warehouse: process.env.SNOWFLAKE_WAREHOUSE!,
    database: process.env.SNOWFLAKE_DATABASE!,
    role: 'ACCOUNTADMIN',
  });

  await new Promise<void>((resolve, reject) => {
    connection.connect((err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  try {
    console.log('Checking staging view data...\n');

    const count = await executeSql(connection, `
      SELECT COUNT(*) as cnt
      FROM dev_db.staging_staging.stg_rxnorm__ndc_mappings
    `);
    console.log(`Total rows in stg_rxnorm__ndc_mappings: ${count[0].CNT.toLocaleString()}`);

    const samples = await executeSql(connection, `
      SELECT ndc_raw, ndc_normalized, LENGTH(ndc_normalized) as len, rxcui
      FROM dev_db.staging_staging.stg_rxnorm__ndc_mappings
      LIMIT 10
    `);
    console.log('\nSample NDCs from staging view:');
    console.table(samples);

    // Check if any claims NDC matches
    console.log('\nChecking if claim NDC 00003089421 (ELIQUIS) matches anything:');
    const eliquis = await executeSql(connection, `
      SELECT ndc_raw, ndc_normalized, rxcui
      FROM dev_db.staging_staging.stg_rxnorm__ndc_mappings
      WHERE ndc_normalized = '00003089421'
        OR ndc_normalized LIKE '%00003089421%'
        OR ndc_raw LIKE '%00003089421%'
      LIMIT 5
    `);
    if (eliquis.length > 0) {
      console.table(eliquis);
    } else {
      console.log('No matches found');
    }

    // Search for similar
    console.log('\nSearching for NDCs starting with 00003:');
    const similar = await executeSql(connection, `
      SELECT ndc_raw, ndc_normalized, LENGTH(ndc_normalized) as len, rxcui
      FROM dev_db.staging_staging.stg_rxnorm__ndc_mappings
      WHERE ndc_normalized LIKE '00003%'
      LIMIT 10
    `);
    console.table(similar);

  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    await new Promise<void>((resolve) => {
      connection.destroy((err) => {
        if (err) console.error('Error closing connection:', err);
        resolve();
      });
    });
  }
}

checkStagingData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
