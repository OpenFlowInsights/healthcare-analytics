import snowflake from 'snowflake-sdk';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function executeSql(connection: any, sql: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    connection.execute({
      sqlText: sql,
      complete: (err: any, stmt: any, rows: any) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(rows || []);
      },
    });
  });
}

async function main() {
  const config = {
    account: process.env.SNOWFLAKE_ACCOUNT!,
    username: process.env.SNOWFLAKE_USERNAME!,
    password: process.env.SNOWFLAKE_PASSWORD!,
    warehouse: process.env.SNOWFLAKE_WAREHOUSE!,
    database: process.env.SNOWFLAKE_DATABASE || 'DEV_DB',
    role: 'ACCOUNTADMIN',
  };

  console.log('='.repeat(80));
  console.log('DATA VALIDATION REPORT');
  console.log('='.repeat(80));
  console.log();

  const connection: any = snowflake.createConnection(config);

  await new Promise<void>((resolve, reject) => {
    connection.connect((err: any) => {
      if (err) {
        console.error('Connection failed:', err);
        reject(err);
      } else {
        console.log('✓ Connected to Snowflake\n');
        resolve();
      }
    });
  });

  try {
    await executeSql(connection, `USE DATABASE ${config.database}`);

    // ======================================
    // 1. Row counts per table by source_vintage
    // ======================================
    console.log('\n' + '='.repeat(80));
    console.log('1. ROW COUNTS BY TABLE AND SOURCE_VINTAGE');
    console.log('='.repeat(80));
    console.log();

    const cmsTables = [
      'plan_information',
      'beneficiary_cost',
      'formulary',
      'excluded_drugs_formulary',
      'insulin_beneficiary_cost',
      'indication_formulary',
      'geographic_locator',
      'drug_pricing',
      'pharmacy_networks',
      'spending_by_drug_annual',
      'spending_by_drug_quarterly'
    ];

    for (const table of cmsTables) {
      console.log(`\nTable: raw_cms_partd.${table}`);
      try {
        const result = await executeSql(connection, `
          SELECT
            source_vintage,
            COUNT(*) as row_count,
            COUNT(DISTINCT source_file) as file_count
          FROM raw_cms_partd.${table}
          GROUP BY source_vintage
          ORDER BY source_vintage
        `);

        if (result.length > 0) {
          console.table(result);
          const totalRows = result.reduce((sum, row) => sum + row.ROW_COUNT, 0);
          console.log(`Total rows: ${totalRows.toLocaleString()}`);

          // Flag low counts
          if (totalRows < 100 && !['indication_formulary', 'geographic_locator'].includes(table)) {
            console.log(`⚠️  WARNING: Low row count for ${table}: ${totalRows}`);
          }
        } else {
          console.log('❌ No data found');
        }
      } catch (err: any) {
        console.log(`❌ Error querying ${table}: ${err.message}`);
      }
    }

    // ======================================
    // 2. NDC counts in rxnsat by SAB
    // ======================================
    console.log('\n\n' + '='.repeat(80));
    console.log('2. RXNSAT NDC CROSSWALK COUNTS BY SOURCE (SAB)');
    console.log('='.repeat(80));
    console.log();

    const ndcCounts = await executeSql(connection, `
      SELECT
        SAV as source_vocabulary,
        COUNT(*) as ndc_mapping_count,
        COUNT(DISTINCT RXCUI) as distinct_rxcui,
        COUNT(DISTINCT CODE) as distinct_ndc_codes
      FROM raw_rxnorm.rxnsat
      WHERE ATN = 'NDC'
      GROUP BY SAV
      ORDER BY ndc_mapping_count DESC
    `);

    console.log('NDC Mappings by Source:');
    console.table(ndcCounts);
    console.log(`\nTotal NDC mappings: ${ndcCounts.reduce((sum, row) => sum + row.NDC_MAPPING_COUNT, 0).toLocaleString()}`);

    // ======================================
    // 3. RxNorm concepts by term type
    // ======================================
    console.log('\n\n' + '='.repeat(80));
    console.log('3. RXNORM CONCEPTS BY TERM TYPE (TTY)');
    console.log('='.repeat(80));
    console.log();

    const rxnormConcepts = await executeSql(connection, `
      SELECT
        TTY as term_type,
        COUNT(DISTINCT RXCUI) as distinct_rxcui_count,
        COUNT(*) as total_records
      FROM raw_rxnorm.rxnconso
      WHERE SAB = 'RXNORM'
        AND SUPPRESS = 'N'
      GROUP BY TTY
      ORDER BY distinct_rxcui_count DESC
    `);

    console.log('RxNorm Concepts (SAB=RXNORM, SUPPRESS=N):');
    console.table(rxnormConcepts);
    console.log(`\nTotal distinct RXCUI: ${rxnormConcepts.reduce((sum, row) => sum + row.DISTINCT_RXCUI_COUNT, 0).toLocaleString()}`);

    // ======================================
    // 4. Distinct key columns by source_vintage
    // ======================================
    console.log('\n\n' + '='.repeat(80));
    console.log('4. DISTINCT KEY COLUMNS BY SOURCE_VINTAGE');
    console.log('='.repeat(80));
    console.log();

    const keyColumnQueries: Array<{table: string, key: string, allowEmpty?: boolean}> = [
      { table: 'plan_information', key: 'CONTRACT_ID' },
      { table: 'plan_information', key: 'FORMULARY_ID' },
      { table: 'formulary', key: 'RXCUI', allowEmpty: true },
      { table: 'formulary', key: 'NDC', allowEmpty: true },
      { table: 'formulary', key: 'FORMULARY_ID' },
      { table: 'drug_pricing', key: 'NDC', allowEmpty: true },
      { table: 'pharmacy_networks', key: 'PHARMACY_NUMBER', allowEmpty: true },
      { table: 'spending_by_drug_annual', key: 'Brnd_Name' },
      { table: 'spending_by_drug_quarterly', key: 'Brnd_Name' }
    ];

    for (const { table, key, allowEmpty } of keyColumnQueries) {
      console.log(`\n${table}.${key}:`);
      try {
        const result = await executeSql(connection, `
          SELECT
            source_vintage,
            COUNT(DISTINCT ${key}) as distinct_count,
            COUNT(*) as total_rows,
            ROUND(COUNT(DISTINCT ${key}) * 100.0 / NULLIF(COUNT(*), 0), 2) as uniqueness_pct,
            SUM(CASE WHEN ${key} IS NULL OR ${key} = '' THEN 1 ELSE 0 END) as null_or_empty_count
          FROM raw_cms_partd.${table}
          GROUP BY source_vintage
          ORDER BY source_vintage
        `);
        if (result.length > 0) {
          console.table(result);

          // Flag if all values are empty
          const allEmpty = result.every(r => r.DISTINCT_COUNT === 0);
          if (allEmpty && !allowEmpty) {
            console.log(`  ⚠️  WARNING: All values in ${key} are NULL or empty!`);
          }
        } else {
          console.log('  No data');
        }
      } catch (err: any) {
        console.log(`  Error: ${err.message}`);
      }
    }

    // ======================================
    // 5. Spot check: 5 random RXCUI with drug names and NDC mappings
    // ======================================
    console.log('\n\n' + '='.repeat(80));
    console.log('5. SPOT CHECK: RANDOM RXCUI SAMPLES WITH DRUG NAMES AND NDC MAPPINGS');
    console.log('='.repeat(80));
    console.log();

    const randomRxcuis = await executeSql(connection, `
      SELECT DISTINCT RXCUI
      FROM raw_cms_partd.formulary
      WHERE RXCUI IS NOT NULL AND RXCUI != ''
      ORDER BY RANDOM()
      LIMIT 5
    `);

    console.log(`Selected ${randomRxcuis.length} random RXCUI values for validation...\n`);

    for (const rxcuiRow of randomRxcuis) {
      const rxcui = rxcuiRow.RXCUI;
      console.log(`\n${'─'.repeat(80)}`);
      console.log(`RXCUI: ${rxcui}`);
      console.log(`${'─'.repeat(80)}`);

      // Get drug name from rxnconso
      const drugName = await executeSql(connection, `
        SELECT RXCUI, SAB, TTY, STR as drug_name
        FROM raw_rxnorm.rxnconso
        WHERE RXCUI = '${rxcui}'
          AND SAB = 'RXNORM'
          AND TTY IN ('IN', 'PIN', 'BN', 'SCD', 'SBD')
        LIMIT 5
      `);

      if (drugName.length > 0) {
        console.log('\nDrug Names:');
        console.table(drugName);
      } else {
        console.log('⚠️  No drug name found in rxnconso');
      }

      // Get NDC mappings from rxnsat
      const ndcMappings = await executeSql(connection, `
        SELECT
          RXCUI,
          CODE as ndc_code,
          SAV as source,
          ATN
        FROM raw_rxnorm.rxnsat
        WHERE RXCUI = '${rxcui}'
          AND ATN = 'NDC'
        LIMIT 10
      `);

      if (ndcMappings.length > 0) {
        console.log(`\nNDC Mappings (showing up to 10 of ${ndcMappings.length}):`);
        console.table(ndcMappings);
      } else {
        console.log('⚠️  No NDC mappings found in rxnsat');
      }

      // Check if this RXCUI is in formulary
      const formularyCount = await executeSql(connection, `
        SELECT COUNT(*) as count
        FROM raw_cms_partd.formulary
        WHERE RXCUI = '${rxcui}'
      `);
      console.log(`\nFormulary entries for this RXCUI: ${formularyCount[0].COUNT}`);
    }

    // ======================================
    // 6. RXCUI values in formulary with no match in rxnconso
    // ======================================
    console.log('\n\n' + '='.repeat(80));
    console.log('6. ORPHANED RXCUI VALUES (IN FORMULARY BUT NOT IN RXNCONSO)');
    console.log('='.repeat(80));
    console.log();

    // Count orphaned RXCUI
    const orphanedCount = await executeSql(connection, `
      SELECT COUNT(DISTINCT f.RXCUI) as orphaned_rxcui_count
      FROM raw_cms_partd.formulary f
      LEFT JOIN raw_rxnorm.rxnconso c ON f.RXCUI = c.RXCUI
      WHERE f.RXCUI IS NOT NULL
        AND f.RXCUI != ''
        AND c.RXCUI IS NULL
    `);

    console.log(`Total orphaned RXCUI values: ${orphanedCount[0].ORPHANED_RXCUI_COUNT.toLocaleString()}`);

    // Get examples
    const orphanedExamples = await executeSql(connection, `
      SELECT
        f.RXCUI,
        COUNT(*) as formulary_occurrence_count,
        COUNT(DISTINCT f.FORMULARY_ID) as distinct_formularies
      FROM raw_cms_partd.formulary f
      LEFT JOIN raw_rxnorm.rxnconso c ON f.RXCUI = c.RXCUI
      WHERE f.RXCUI IS NOT NULL
        AND f.RXCUI != ''
        AND c.RXCUI IS NULL
      GROUP BY f.RXCUI
      ORDER BY formulary_occurrence_count DESC
      LIMIT 10
    `);

    if (orphanedExamples.length > 0) {
      console.log('\n⚠️  WARNING: Found RXCUI values in formulary with no match in rxnconso!');
      console.log('\nTop 10 examples (by frequency):');
      console.table(orphanedExamples);
    } else {
      console.log('✓ All RXCUI values in formulary have matches in rxnconso');
    }

    // Calculate percentage
    const totalDistinctRxcui = await executeSql(connection, `
      SELECT COUNT(DISTINCT RXCUI) as count
      FROM raw_cms_partd.formulary
      WHERE RXCUI IS NOT NULL AND RXCUI != ''
    `);

    const orphanPct = (orphanedCount[0].ORPHANED_RXCUI_COUNT / totalDistinctRxcui[0].COUNT) * 100;
    console.log(`\nOrphaned RXCUI percentage: ${orphanPct.toFixed(2)}%`);

    if (orphanPct > 10) {
      console.log('🚨 CRITICAL: More than 10% of RXCUI values are orphaned!');
    } else if (orphanPct > 5) {
      console.log('⚠️  WARNING: More than 5% of RXCUI values are orphaned');
    } else {
      console.log('✓ Orphaned RXCUI percentage is within acceptable range');
    }

    // ======================================
    // FINAL SUMMARY
    // ======================================
    console.log('\n\n' + '='.repeat(80));
    console.log('VALIDATION SUMMARY');
    console.log('='.repeat(80));
    console.log();

    // Get total row counts
    const rxnconsoTotal = await executeSql(connection, 'SELECT COUNT(*) as count FROM raw_rxnorm.rxnconso');
    const rxnsatTotal = await executeSql(connection, 'SELECT COUNT(*) as count FROM raw_rxnorm.rxnsat');

    console.log('RxNorm Data:');
    console.log(`  - rxnconso: ${rxnconsoTotal[0].COUNT.toLocaleString()} rows`);
    console.log(`  - rxnsat: ${rxnsatTotal[0].COUNT.toLocaleString()} rows`);
    console.log(`  - NDC mappings: ${ndcCounts.reduce((sum, row) => sum + row.NDC_MAPPING_COUNT, 0).toLocaleString()}`);
    console.log();

    console.log('CMS Part D Data (2025Q4):');
    for (const table of cmsTables) {
      try {
        const count = await executeSql(connection, `SELECT COUNT(*) as count FROM raw_cms_partd.${table}`);
        console.log(`  - ${table}: ${count[0].COUNT.toLocaleString()} rows`);
      } catch (err) {
        console.log(`  - ${table}: Error`);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('✓ Validation Complete');
    console.log('='.repeat(80));
    console.log();

  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    connection.destroy((err: any) => {
      if (err) {
        console.error('Error closing connection:', err);
      } else {
        console.log('Connection closed.');
      }
    });
  }
}

main().catch(console.error);
