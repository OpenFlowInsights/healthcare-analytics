import { querySnowflake, getSnowflakeConfig } from './lib/snowflake';

async function main() {
  const config = getSnowflakeConfig();
  const year = 2024;

  const sql = `
    SELECT
      "ACO_ID"::VARCHAR as ACO_ID,
      TRY_CAST("YEAR"::VARCHAR AS INT) as YEAR,
      "STATE_NAME"::VARCHAR as STATE_NAME,
      "STATE_ID"::VARCHAR as STATE_ID,
      "COUNTY_NAME"::VARCHAR as COUNTY_NAME,
      "COUNTY_ID"::VARCHAR as COUNTY_ID,
      TRY_CAST("TOT_AB"::VARCHAR AS INT) as TOT_AB,
      TRY_CAST("TOT_AB_PSN_YRS"::VARCHAR AS FLOAT) as TOT_AB_PSN_YRS,
      TRY_CAST("AB_PSN_YRS_AGDU"::VARCHAR AS FLOAT) as AB_PSN_YRS_AGDU,
      TRY_CAST("AB_PSN_YRS_AGND"::VARCHAR AS FLOAT) as AB_PSN_YRS_AGND,
      TRY_CAST("AB_PSN_YRS_DIS"::VARCHAR AS FLOAT) as AB_PSN_YRS_DIS,
      TRY_CAST("AB_PSN_YRS_ESRD"::VARCHAR AS FLOAT) as AB_PSN_YRS_ESRD
    FROM ${config.database}.${config.schema}.ACO_BENE_BY_COUNTY
    WHERE TRY_CAST("YEAR"::VARCHAR AS INT) = ${year}
    ORDER BY "STATE_NAME"::VARCHAR, "COUNTY_NAME"::VARCHAR
    LIMIT 5
  `;

  console.log('Testing query...');
  console.log(sql);
  const rows = await querySnowflake(sql, config);
  console.log(`\nFetched ${rows.length} rows`);
  if (rows.length > 0) {
    console.log('\nFirst row:');
    console.log(JSON.stringify(rows[0], null, 2));
  }
}

main().catch(err => console.error('Error:', err.message));
