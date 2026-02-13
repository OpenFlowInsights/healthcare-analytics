import { querySnowflake, getSnowflakeConfig } from './lib/snowflake';

async function main() {
  const config = getSnowflakeConfig();

  console.log('Querying ACO_BENE_BY_COUNTY table...');
  const sample = await querySnowflake('SELECT * FROM DEV_DB.MSSP_ACO.ACO_BENE_BY_COUNTY LIMIT 1', config);

  if (sample.length > 0) {
    console.log('\nColumn names:');
    Object.keys(sample[0]).forEach(col => console.log('  ' + col));

    console.log('\n\nFirst row sample:');
    console.log(JSON.stringify(sample[0], null, 2));
  }
}

main().catch(err => console.error('Error:', err.message, err.stack));
