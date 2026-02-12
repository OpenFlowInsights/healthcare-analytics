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

  const sql = `SELECT * FROM DEV_DB.MSSP_ACO.ACO_PUF LIMIT 1`;

  console.log('Executing SQL (SELECT *):', sql);

  connection.execute({
    sqlText: sql,
    complete: (err, stmt, rows) => {
      if (err) {
        console.error('Error:', err);
        connection.destroy();
        process.exit(1);
      }

      if (rows.length > 0) {
        console.log('Success!');
        console.log('Columns:', Object.keys(rows[0]));
        console.log('Sample performance_year value:', rows[0].performance_year);
      }
      connection.destroy();
    }
  });
});
