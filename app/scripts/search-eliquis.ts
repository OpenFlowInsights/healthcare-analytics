import snowflake from 'snowflake-sdk';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env.local') });

async function executeSql(connection: any, sqlText: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    connection.execute({
      sqlText,
      complete: (err: any, stmt: any, rows: any) => {
        if (err) reject(err);
        else resolve(rows || []);
      }
    });
  });
}

async function searchEliquis() {
  const connection = snowflake.createConnection({
    account: process.env.SNOWFLAKE_ACCOUNT!,
    username: process.env.SNOWFLAKE_USERNAME!,
    password: process.env.SNOWFLAKE_PASSWORD!,
    warehouse: process.env.SNOWFLAKE_WAREHOUSE!,
    database: process.env.SNOWFLAKE_DATABASE!,
    role: 'ACCOUNTADMIN',
  });

  await new Promise<void>((resolve, reject) => {
    connection.connect((err: any) => {
      if (err) reject(err);
      else resolve();
    });
  });

  try {
    console.log('Searching for Eliquis/Apixaban in RxNorm...\n');

    const drugs = await executeSql(connection, `
      SELECT RXCUI, STR as concept_name, TTY as term_type
      FROM raw_rxnorm.rxnconso
      WHERE (STR ILIKE '%eliquis%' OR STR ILIKE '%apixaban%')
        AND SUPPRESS = 'N'
      LIMIT 10
    `);
    console.log('Found drugs:');
    console.table(drugs);

    if (drugs.length > 0) {
      const rxcui = drugs[0].RXCUI;
      console.log(`\nSearching for NDCs for RXCUI ${rxcui}:`);

      const ndcs = await executeSql(connection, `
        SELECT CODE, ATN, SAB
        FROM raw_rxnorm.rxnsat
        WHERE RXCUI = '${rxcui}'
          AND ATN = 'NDC'
        LIMIT 20
      `);
      console.table(ndcs);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await new Promise<void>((resolve) => {
      connection.destroy((err: any) => {
        if (err) console.error('Error closing connection:', err);
        resolve();
      });
    });
  }
}

searchEliquis().then(() => process.exit(0)).catch(() => process.exit(1));
