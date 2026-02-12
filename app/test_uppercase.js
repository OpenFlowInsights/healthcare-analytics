const snowflake = require('snowflake-sdk');
const fs = require('fs');

const config = {
  account: 'jic51019.us-east-1',
  username: 'APP_SERVICE',
  authenticator: 'SNOWFLAKE_JWT',
  privateKey: fs.readFileSync('rsa_key.p8', 'utf8'),
  database: 'DEV_DB',
  warehouse: 'DEV_WH',
  role: 'ACCOUNTADMIN',
};

const connection = snowflake.createConnection(config);

connection.connect((err) => {
  if (err) {
    console.error('Connection error:', err);
    process.exit(1);
  }

  const sql = `SELECT DISTINCT PERFORMANCE_YEAR FROM DEV_DB.MSSP_ACO.ACO_PUF WHERE PERFORMANCE_YEAR IS NOT NULL ORDER BY PERFORMANCE_YEAR DESC`;

  console.log('Executing SQL (uppercase):', sql);

  connection.execute({
    sqlText: sql,
    complete: (err, stmt, rows) => {
      if (err) {
        console.error('Error:', err);
        connection.destroy();
        process.exit(1);
      }

      console.log('Success! Results:', rows);
      connection.destroy();
    }
  });
});
