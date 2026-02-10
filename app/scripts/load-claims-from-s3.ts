import snowflake from 'snowflake-sdk';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

interface SnowflakeRow {
  [key: string]: any;
}

async function executeSql(connection: snowflake.Connection, sqlText: string): Promise<SnowflakeRow[]> {
  return new Promise((resolve, reject) => {
    connection.execute({
      sqlText,
      complete: (err, stmt, rows) => {
        if (err) {
          console.error('Failed to execute statement:', err);
          reject(err);
        } else {
          resolve(rows || []);
        }
      }
    });
  });
}

async function loadClaimsData() {
  const connection = snowflake.createConnection({
    account: process.env.SNOWFLAKE_ACCOUNT!,
    username: process.env.SNOWFLAKE_USERNAME!,
    password: process.env.SNOWFLAKE_PASSWORD!,
    warehouse: process.env.SNOWFLAKE_WAREHOUSE!,
    database: process.env.SNOWFLAKE_DATABASE!,
    role: 'ACCOUNTADMIN',
  });

  await new Promise<void>((resolve, reject) => {
    connection.connect((err) => {
      if (err) {
        console.error('Unable to connect:', err);
        reject(err);
      } else {
        console.log('✓ Successfully connected to Snowflake');
        resolve();
      }
    });
  });

  try {
    // 1. Create schema if not exists
    console.log('\n1. Creating raw_claims schema...');
    await executeSql(connection, 'CREATE SCHEMA IF NOT EXISTS raw_claims');
    console.log('✓ Schema raw_claims created/verified');

    // 2. Create stage pointing to S3
    console.log('\n2. Creating S3 stage...');
    const createStageSQL = `
      CREATE OR REPLACE STAGE raw_claims.s3_claims_stage
      URL = 's3://ofi-healthcare-data/sample-file/'
      STORAGE_INTEGRATION = S3_INTEGRATION
      FILE_FORMAT = (
        TYPE = 'CSV',
        FIELD_DELIMITER = ',',
        SKIP_HEADER = 1,
        FIELD_OPTIONALLY_ENCLOSED_BY = '"',
        TRIM_SPACE = TRUE,
        NULL_IF = ('', 'NULL', 'null')
      )
    `;
    await executeSql(connection, createStageSQL);
    console.log('✓ Stage raw_claims.s3_claims_stage created');

    // 3. List files in stage
    console.log('\n3. Listing files in stage...');
    const files = await executeSql(connection, 'LIST @raw_claims.s3_claims_stage');
    console.log('Files found:');
    files.forEach(file => {
      console.log(`  - ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
    });

    // 4. Read first 5 rows to confirm structure
    console.log('\n4. Reading first 5 rows...');
    const sampleRows = await executeSql(connection, `
      SELECT
        $1 as claimid,
        $2 as ndc,
        $3 as bn,
        $4 as Unit_Count,
        $5 as Unit_Dosage,
        $6 as PrescriptionCost,
        $7 as paid,
        $8 as PRESCRIBEDDAYSSUPPLY,
        $9 as PRESCRIBER_NPI,
        $10 as PRESCRIBER_NAME,
        $11 as GTCDesc,
        $12 as ETC_Name,
        $13 as TM_ALT_NDC_DESC,
        $14 as Servicing_Provider_Grouping,
        $15 as PharmacyClassDescription
      FROM @raw_claims.s3_claims_stage
      LIMIT 5
    `);
    console.log('Sample rows:');
    console.table(sampleRows);

    // 5. Create table
    console.log('\n5. Creating rx_claims table...');
    const createTableSQL = `
      CREATE OR REPLACE TABLE raw_claims.rx_claims (
        claimid VARCHAR,
        ndc VARCHAR,
        bn VARCHAR,
        Unit_Count VARCHAR,
        Unit_Dosage VARCHAR,
        PrescriptionCost VARCHAR,
        paid VARCHAR,
        PRESCRIBEDDAYSSUPPLY VARCHAR,
        PRESCRIBER_NPI VARCHAR,
        PRESCRIBER_NAME VARCHAR,
        GTCDesc VARCHAR,
        ETC_Name VARCHAR,
        TM_ALT_NDC_DESC VARCHAR,
        Servicing_Provider_Grouping VARCHAR,
        PharmacyClassDescription VARCHAR,
        loaded_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
      )
    `;
    await executeSql(connection, createTableSQL);
    console.log('✓ Table raw_claims.rx_claims created');

    // 6. Load data
    console.log('\n6. Loading data from stage...');
    const copySQL = `
      COPY INTO raw_claims.rx_claims (
        claimid, ndc, bn, Unit_Count, Unit_Dosage, PrescriptionCost, paid,
        PRESCRIBEDDAYSSUPPLY, PRESCRIBER_NPI, PRESCRIBER_NAME, GTCDesc,
        ETC_Name, TM_ALT_NDC_DESC, Servicing_Provider_Grouping, PharmacyClassDescription
      )
      FROM @raw_claims.s3_claims_stage
      FILE_FORMAT = (
        TYPE = 'CSV',
        FIELD_DELIMITER = ',',
        SKIP_HEADER = 1,
        FIELD_OPTIONALLY_ENCLOSED_BY = '"',
        TRIM_SPACE = TRUE,
        NULL_IF = ('', 'NULL', 'null')
      )
    `;
    const copyResult = await executeSql(connection, copySQL);
    console.log('Copy results:');
    console.table(copyResult);

    // 7. Validation queries
    console.log('\n7. Running validation queries...');

    const rowCount = await executeSql(connection,
      'SELECT COUNT(*) as row_count FROM raw_claims.rx_claims'
    );
    console.log(`Total rows: ${rowCount[0].ROW_COUNT.toLocaleString()}`);

    const ndcCount = await executeSql(connection,
      'SELECT COUNT(DISTINCT ndc) as distinct_ndc FROM raw_claims.rx_claims WHERE ndc IS NOT NULL'
    );
    console.log(`Distinct NDCs: ${ndcCount[0].DISTINCT_NDC.toLocaleString()}`);

    const prescriberCount = await executeSql(connection,
      'SELECT COUNT(DISTINCT PRESCRIBER_NPI) as distinct_prescribers FROM raw_claims.rx_claims WHERE PRESCRIBER_NPI IS NOT NULL'
    );
    console.log(`Distinct prescribers: ${prescriberCount[0].DISTINCT_PRESCRIBERS.toLocaleString()}`);

    const totalCost = await executeSql(connection,
      'SELECT SUM(TRY_CAST(PrescriptionCost AS DECIMAL(18,2))) as total_cost FROM raw_claims.rx_claims'
    );
    console.log(`Total prescription cost: $${parseFloat(totalCost[0].TOTAL_COST).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);

    // 8. NDC matching analysis
    console.log('\n8. Checking NDC matching with RxNorm...');

    // Pick 5 random NDCs from claims
    console.log('\nSpot check: 5 random NDCs from claims...');
    const randomNDCs = await executeSql(connection, `
      SELECT DISTINCT ndc
      FROM raw_claims.rx_claims
      WHERE ndc IS NOT NULL
      ORDER BY RANDOM()
      LIMIT 5
    `);

    console.log('\nLooking up in RxNorm:');
    for (const row of randomNDCs) {
      const ndc = row.NDC;
      const normalized = ndc.replace(/[^0-9]/g, '').padStart(11, '0');

      const rxnormMatch = await executeSql(connection, `
        SELECT RXCUI, CODE as ndc_value
        FROM raw_rxnorm.rxnsat
        WHERE ATN = 'NDC'
          AND (
            REPLACE(CODE, '-', '') = '${ndc.replace(/[^0-9]/g, '')}'
            OR LPAD(REPLACE(CODE, '-', ''), 11, '0') = '${normalized}'
          )
        LIMIT 1
      `);

      if (rxnormMatch.length > 0) {
        console.log(`  ✓ NDC ${ndc} → RXCUI ${rxnormMatch[0].RXCUI} (${rxnormMatch[0].NDC_VALUE})`);
      } else {
        console.log(`  ✗ NDC ${ndc} → No match in RxNorm`);
      }
    }

    // Overall match rate
    console.log('\nCalculating overall NDC match rate...');
    const matchRate = await executeSql(connection, `
      WITH claims_ndcs AS (
        SELECT DISTINCT
          ndc,
          LPAD(REPLACE(ndc, '-', ''), 11, '0') as ndc_normalized
        FROM raw_claims.rx_claims
        WHERE ndc IS NOT NULL
      ),
      rxnorm_ndcs AS (
        SELECT DISTINCT
          LPAD(REPLACE(CODE, '-', ''), 11, '0') as ndc_normalized
        FROM raw_rxnorm.rxnsat
        WHERE ATN = 'NDC'
      )
      SELECT
        COUNT(DISTINCT c.ndc) as total_claim_ndcs,
        COUNT(DISTINCT CASE WHEN r.ndc_normalized IS NOT NULL THEN c.ndc END) as matched_ndcs,
        ROUND(100.0 * COUNT(DISTINCT CASE WHEN r.ndc_normalized IS NOT NULL THEN c.ndc END) /
              NULLIF(COUNT(DISTINCT c.ndc), 0), 2) as match_rate_pct
      FROM claims_ndcs c
      LEFT JOIN rxnorm_ndcs r ON c.ndc_normalized = r.ndc_normalized
    `);

    console.log('\nOverall NDC match rate:');
    console.log(`  Total claim NDCs: ${matchRate[0].TOTAL_CLAIM_NDCS.toLocaleString()}`);
    console.log(`  Matched in RxNorm: ${matchRate[0].MATCHED_NDCS.toLocaleString()}`);
    console.log(`  Match rate: ${matchRate[0].MATCH_RATE_PCT}%`);

    console.log('\n✓ Claims data loading and validation complete!');

  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    await new Promise<void>((resolve) => {
      connection.destroy((err) => {
        if (err) {
          console.error('Error closing connection:', err);
        }
        resolve();
      });
    });
  }
}

// Run the script
loadClaimsData()
  .then(() => {
    console.log('\nScript completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
