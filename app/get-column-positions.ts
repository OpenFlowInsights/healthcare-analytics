import { querySnowflake, getSnowflakeConfig } from './lib/snowflake';

async function main() {
  const config = getSnowflakeConfig();

  const rows = await querySnowflake('SELECT * FROM DEV_DB.MSSP_ACO.ACO_BENE_BY_COUNTY LIMIT 1', config);
  const columns = Object.keys(rows[0]);

  console.log('Column positions for ACO_BENE_BY_COUNTY:');
  columns.forEach((col, idx) => {
    const cleanName = col.replace('"', '').replace('"::VARCHAR', '').replace('::VARCHAR', '');
    console.log(`  $${idx + 1}: ${cleanName}`);
  });

  console.log('\n\nNow testing positional SELECT:');
  const sql = `
    SELECT
      $5 as ACO_ID,
      TRY_CAST($12 AS INT) as YEAR,
      $9 as STATE_NAME,
      $8 as STATE_ID,
      $7 as COUNTY_NAME,
      $6 as COUNTY_ID,
      TRY_CAST($10 AS INT) as TOT_AB,
      TRY_CAST($11 AS FLOAT) as TOT_AB_PSN_YRS,
      TRY_CAST($1 AS FLOAT) as AB_PSN_YRS_AGDU,
      TRY_CAST($2 AS FLOAT) as AB_PSN_YRS_AGND,
      TRY_CAST($3 AS FLOAT) as AB_PSN_YRS_DIS,
      TRY_CAST($4 AS FLOAT) as AB_PSN_YRS_ESRD
    FROM DEV_DB.MSSP_ACO.ACO_BENE_BY_COUNTY
    WHERE TRY_CAST($12 AS INT) = 2024
    LIMIT 3
  `;

  const testRows = await querySnowflake(sql, config);
  console.log('✓ Positional query works! Got', testRows.length, 'rows');
  console.log('Sample:', testRows[0]);
}

main().catch(err => console.error('Error:', err.message));
