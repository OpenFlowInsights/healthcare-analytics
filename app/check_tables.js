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

  // Show all schemas
  connection.execute({
    sqlText: 'SHOW SCHEMAS IN DATABASE DEV_DB',
    complete: (err, stmt, rows) => {
      if (err) {
        console.error('Error showing schemas:', err);
        connection.destroy();
        process.exit(1);
      }
      
      console.log('\n===== Available schemas in DEV_DB =====');
      rows.forEach(row => {
        console.log('  -', row.name);
      });

      // Check for ACO-related tables in ANALYTICS schema
      connection.execute({
        sqlText: "SHOW TABLES IN SCHEMA DEV_DB.ANALYTICS LIKE '%ACO%'",
        complete: (err, stmt, rows) => {
          if (!err && rows.length > 0) {
            console.log('\n===== ACO tables in ANALYTICS schema =====');
            rows.forEach(row => {
              console.log('  -', row.name);
            });
          }

          // Check MSSP_ACO schema
          connection.execute({
            sqlText: 'SHOW TABLES IN SCHEMA DEV_DB.MSSP_ACO',
            complete: (err, stmt, rows) => {
              if (!err) {
                console.log('\n===== Tables in MSSP_ACO schema =====');
                if (rows.length === 0) {
                  console.log('  (No tables found)');
                } else {
                  rows.forEach(row => {
                    console.log('  -', row.name);
                  });
                }
              } else {
                console.log('\nMSSP_ACO schema: ERROR -', err.message);
              }
              connection.destroy();
            }
          });
        }
      });
    }
  });
});
