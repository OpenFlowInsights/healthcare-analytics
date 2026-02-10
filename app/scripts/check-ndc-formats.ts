import snowflake from 'snowflake-sdk';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env.local') });

interface SnowflakeRow {
  [key: string]: any;
}

async function executeSql(connection: snowflake.Connection, sqlText: string): Promise<SnowflakeRow[]> {
  return new Promise((resolve, reject) => {
    connection.execute({
      sqlText,
      complete: (err, stmt, rows) => {
        if (err) {
          console.error('Failed to execute statement:', err);
          reject(err);
        } else {
          resolve(rows || []);
        }
      }
    });
  });
}

async function checkNDCFormats() {
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
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });

  try {
    console.log('Checking Claims NDC formats:');
    const claimsNDCs = await executeSql(connection, `
      SELECT ndc, LENGTH(ndc) as len
      FROM raw_claims.rx_claims
      WHERE ndc IS NOT NULL
      LIMIT 10
    `);
    console.table(claimsNDCs);

    console.log('\nChecking RxNorm NDC formats:');
    const rxnormNDCs = await executeSql(connection, `
      SELECT CODE as ndc, LENGTH(CODE) as len, RXCUI
      FROM raw_rxnorm.rxnsat
      WHERE ATN = 'NDC' AND CODE IS NOT NULL
      LIMIT 10
    `);
    console.table(rxnormNDCs);

    console.log('\nChecking if claims NDC 70710168300 matches any RxNorm format:');
    const testMatches = await executeSql(connection, `
      SELECT CODE, RXCUI, LENGTH(CODE) as len
      FROM raw_rxnorm.rxnsat
      WHERE ATN = 'NDC'
        AND (
          CODE = '70710168300'
          OR CODE = '70710-1683-00'
          OR CODE = '70710-168-300'
          OR REPLACE(CODE, '-', '') = '70710168300'
        )
      LIMIT 5
    `);
    if (testMatches.length > 0) {
      console.log('Found matches:');
      console.table(testMatches);
    } else {
      console.log('No matches found');
    }

    console.log('\nChecking NDC patterns in RxNorm (with dashes):');
    const dashPatterns = await executeSql(connection, `
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN CODE LIKE '%-%' THEN 1 ELSE 0 END) as with_dashes,
        SUM(CASE WHEN CODE NOT LIKE '%-%' THEN 1 ELSE 0 END) as without_dashes
      FROM raw_rxnorm.rxnsat
      WHERE ATN = 'NDC'
    `);
    console.table(dashPatterns);

    console.log('\nTrying to find RxNorm NDC that starts with 707101:');
    const similarNDCs = await executeSql(connection, `
      SELECT CODE, RXCUI
      FROM raw_rxnorm.rxnsat
      WHERE ATN = 'NDC'
        AND (
          CODE LIKE '707101%'
          OR REPLACE(CODE, '-', '') LIKE '707101%'
        )
      LIMIT 10
    `);
    console.table(similarNDCs);

  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    await new Promise<void>((resolve) => {
      connection.destroy((err) => {
        if (err) {
          console.error('Error closing connection:', err);
        }
        resolve();
      });
    });
  }
}

checkNDCFormats()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
