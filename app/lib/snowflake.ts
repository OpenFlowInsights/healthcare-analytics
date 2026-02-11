import snowflake from 'snowflake-sdk';

export interface SnowflakeConfig {
  account: string;
  username: string;
  authenticator: 'SNOWFLAKE_JWT';
  privateKey: string;
  database: string;
  schema: string;
  warehouse: string;
  role: string;
}

export async function querySnowflake<T = any>(
  sql: string,
  config: SnowflakeConfig
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const connection = snowflake.createConnection(config);

    connection.connect((err) => {
      if (err) {
        reject(err);
        return;
      }

      connection.execute({
        sqlText: sql,
        complete: (err, stmt, rows) => {
          connection.destroy((err: any) => {
            if (err) console.error('Error destroying connection:', err);
          });

          if (err) {
            reject(err);
            return;
          }

          resolve(rows as T[]);
        },
      });
    });
  });
}

export const getSnowflakeConfig = (): SnowflakeConfig => ({
  account: process.env.SNOWFLAKE_ACCOUNT || '',
  username: process.env.SNOWFLAKE_USERNAME || '',
  authenticator: 'SNOWFLAKE_JWT',
  privateKey: (process.env.SNOWFLAKE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  database: process.env.SNOWFLAKE_DATABASE || 'DEV_DB',
  schema: process.env.SNOWFLAKE_SCHEMA || 'STAGING_ANALYTICS',
  warehouse: process.env.SNOWFLAKE_WAREHOUSE || 'DEV_WH',
  role: process.env.SNOWFLAKE_ROLE || 'ACCOUNTADMIN',
});
