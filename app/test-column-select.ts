import { querySnowflake, getSnowflakeConfig } from './lib/snowflake';

async function main() {
  const config = getSnowflakeConfig();

  console.log('Test 1: SELECT "ACO_ID" (quoted, no type suffix)');
  try {
    const rows = await querySnowflake('SELECT "ACO_ID" FROM DEV_DB.MSSP_ACO.ACO_BENE_BY_COUNTY LIMIT 2', config);
    console.log('✓ Works! Columns:', Object.keys(rows[0]));
  } catch (err: any) {
    console.log('✗ Failed:', err.message.split('\n')[0]);
  }

  console.log('\nTest 2: SELECT ACO_ID (unquoted)');
  try {
    const rows = await querySnowflake('SELECT ACO_ID FROM DEV_DB.MSSP_ACO.ACO_BENE_BY_COUNTY LIMIT 2', config);
    console.log('✓ Works! Columns:', Object.keys(rows[0]));
  } catch (err: any) {
    console.log('✗ Failed:', err.message.split('\n')[0]);
  }

  console.log('\nTest 3: SELECT with column() function');
  try {
    const rows = await querySnowflake('SELECT $1 as ACO_ID FROM DEV_DB.MSSP_ACO.ACO_BENE_BY_COUNTY LIMIT 2', config);
    console.log('✓ Works! Columns:', Object.keys(rows[0]));
  } catch (err: any) {
    console.log('✗ Failed:', err.message.split('\n')[0]);
  }
}

main().catch(console.error);
