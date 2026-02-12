import snowflake from 'snowflake-sdk';
import fs from 'fs';
import path from 'path';

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

const getPrivateKey = (): string => {
  // Try reading from file first (for local/server builds)
  const keyPath = path.join(process.cwd(), 'rsa_key.p8');

  if (fs.existsSync(keyPath)) {
    console.log('[BUILD] Using private key from file');
    return fs.readFileSync(keyPath, 'utf8');
  }

  // Fall back to environment variable (for Vercel)
  console.log('[BUILD] Using private key from env var');
  return (process.env.SNOWFLAKE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
};

export const getSnowflakeConfig = (): SnowflakeConfig => ({
  account: process.env.SNOWFLAKE_ACCOUNT || 'jic51019.us-east-1',
  username: process.env.SNOWFLAKE_USERNAME || 'APP_SERVICE',
  authenticator: 'SNOWFLAKE_JWT',
  privateKey: getPrivateKey(),
  database: process.env.SNOWFLAKE_DATABASE || 'DEV_DB',
  schema: process.env.SNOWFLAKE_SCHEMA || 'MSSP_ACO',
  warehouse: process.env.SNOWFLAKE_WAREHOUSE || 'DEV_WH',
  role: process.env.SNOWFLAKE_ROLE || 'ACCOUNTADMIN',
});
