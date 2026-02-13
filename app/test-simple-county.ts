import { querySnowflake, getSnowflakeConfig } from './lib/snowflake';

async function main() {
  const config = getSnowflakeConfig();

  // Test 1: SELECT * works
  console.log('Test 1: SELECT *');
  try {
    const rows1 = await querySnowflake('SELECT * FROM DEV_DB.MSSP_ACO.ACO_BENE_BY_COUNTY LIMIT 1', config);
    console.log('✓ Works! Columns:', Object.keys(rows1[0]).slice(0, 3));
  } catch (err: any) {
    console.log('✗ Failed:', err.message.split('\n')[0]);
  }

  // Test 2: SELECT with column name
  console.log('\nTest 2: SELECT "ACO_ID"::VARCHAR');
  try {
    const rows2 = await querySnowflake('SELECT "ACO_ID"::VARCHAR FROM DEV_DB.MSSP_ACO.ACO_BENE_BY_COUNTY LIMIT 1', config);
    console.log('✓ Works! Got', rows2.length, 'rows');
  } catch (err: any) {
    console.log('✗ Failed:', err.message.split('\n')[0]);
  }

  // Test 3: SELECT with alias
  console.log('\nTest 3: SELECT "ACO_ID"::VARCHAR AS ACO_ID');
  try {
    const rows3 = await querySnowflake('SELECT "ACO_ID"::VARCHAR AS ACO_ID FROM DEV_DB.MSSP_ACO.ACO_BENE_BY_COUNTY LIMIT 1', config);
    console.log('✓ Works! Columns:', Object.keys(rows3[0]));
  } catch (err: any) {
    console.log('✗ Failed:', err.message.split('\n')[0]);
  }

  // Test 4: SELECT multiple columns
  console.log('\nTest 4: SELECT two columns with aliases');
  try {
    const rows4 = await querySnowflake('SELECT "ACO_ID"::VARCHAR AS ACO_ID, "YEAR"::VARCHAR AS YR FROM DEV_DB.MSSP_ACO.ACO_BENE_BY_COUNTY LIMIT 1', config);
    console.log('✓ Works! Columns:', Object.keys(rows4[0]));
  } catch (err: any) {
    console.log('✗ Failed:', err.message.split('\n')[0]);
  }

  // Test 5: Multi-line query
  console.log('\nTest 5: Multi-line query');
  try {
    const sql = `
      SELECT
        "ACO_ID"::VARCHAR AS ACO_ID,
        "YEAR"::VARCHAR AS YR
      FROM DEV_DB.MSSP_ACO.ACO_BENE_BY_COUNTY
      LIMIT 1
    `;
    const rows5 = await querySnowflake(sql, config);
    console.log('✓ Works! Columns:', Object.keys(rows5[0]));
  } catch (err: any) {
    console.log('✗ Failed:', err.message.split('\n')[0]);
  }
}

main().catch(err => console.error('Fatal error:', err.message));
