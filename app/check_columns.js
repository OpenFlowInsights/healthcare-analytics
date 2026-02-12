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

  connection.execute({
    sqlText: 'SELECT * FROM DEV_DB.MSSP_ACO.ACO_PUF LIMIT 1',
    complete: (err, stmt, rows) => {
      if (err) {
        console.error('Error:', err);
        connection.destroy();
        process.exit(1);
      }
      
      if (rows.length > 0) {
        console.log('\n===== Columns in ACO_PUF =====');
        Object.keys(rows[0]).forEach(col => {
          console.log('  -', col);
        });

        console.log('\n===== Sample row =====');
        console.log(JSON.stringify(rows[0], null, 2));
      }
      
      connection.destroy();
    }
  });
});
