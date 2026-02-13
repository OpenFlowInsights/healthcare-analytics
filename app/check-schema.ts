import { querySnowflake, getSnowflakeConfig } from './lib/snowflake';

async function main() {
  const config = getSnowflakeConfig();

  console.log('Fetching tables...');
  const tables = await querySnowflake('SHOW TABLES IN DEV_DB.MSSP_ACO', config);
  console.log('\nTables in MSSP_ACO schema:');
  tables.forEach((t: any) => console.log('  -', t.name));

  console.log('\n\nChecking if BENE_BY_COUNTY exists...');
  const benesTable = tables.find((t: any) => t.name.toLowerCase().includes('bene'));
  if (benesTable) {
    console.log('Found beneficiary table:', benesTable.name);
    const sample = await querySnowflake(`SELECT * FROM DEV_DB.MSSP_ACO.${benesTable.name} LIMIT 1`, config);
    if (sample.length > 0) {
      console.log('Columns:', Object.keys(sample[0]).join(', '));
    }
  }

  console.log('\n\nChecking ACO_PARTICIPANTS columns...');
  const cols = await querySnowflake('SELECT * FROM DEV_DB.MSSP_ACO.ACO_PARTICIPANTS LIMIT 1', config);
  if (cols.length > 0) {
    console.log('Available columns:', Object.keys(cols[0]).join(', '));
  } else {
    console.log('No data in table');
  }
}

main().catch(console.error);
