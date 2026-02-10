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
  const connection = snowflake.createConnection({
    account: process.env.SNOWFLAKE_ACCOUNT!,
    username: process.env.SNOWFLAKE_USERNAME!,
    password: process.env.SNOWFLAKE_PASSWORD!,
    warehouse: process.env.SNOWFLAKE_WAREHOUSE!,
    database: 'DEV_DB',
  });

  await new Promise<void>((resolve, reject) => {
    connection.connect((err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  console.log('Formulary table sample (3 rows):');
  const formulary = await executeSql(connection, 'SELECT * FROM raw_cms_partd.formulary LIMIT 3');
  console.log(JSON.stringify(formulary, null, 2));

  console.log('\n\nDescribe formulary table:');
  const desc = await executeSql(connection, 'DESCRIBE TABLE raw_cms_partd.formulary');
  console.table(desc);

  connection.destroy((err) => {
    if (err) console.error('Error closing connection:', err);
  });
}

main().catch(console.error);
