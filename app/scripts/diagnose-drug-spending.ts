import { querySnowflake, getSnowflakeConfig } from '../lib/snowflake';

async function diagnose() {
  const config = getSnowflakeConfig();

  console.log('🔍 DIAGNOSIS: Drug Spending Dashboard Performance\n');
  console.log('='.repeat(60));

  try {
    // 1. Check row counts and duplicates for DRUG_SPEND_QUARTERLY_TREND
    console.log('\n📊 TABLE: DRUG_SPEND_QUARTERLY_TREND');
    const trendStart = Date.now();
    const trendCount = await querySnowflake<{ TOTAL: number; DISTINCT_ROWS: number }>(
      `SELECT
        COUNT(*) AS TOTAL,
        COUNT(DISTINCT (YEAR || QUARTER || PROGRAM || TOTAL_SPEND || MEMBER_MONTHS || PMPM)) AS DISTINCT_ROWS
      FROM STAGING_ANALYTICS.DRUG_SPEND_QUARTERLY_TREND`,
      config
    );
    const trendTime = Date.now() - trendStart;
    console.log(`  Total rows: ${trendCount[0].TOTAL}`);
    console.log(`  Distinct rows: ${trendCount[0].DISTINCT_ROWS}`);
    console.log(`  Duplicates: ${trendCount[0].TOTAL - trendCount[0].DISTINCT_ROWS}`);
    console.log(`  Query time: ${trendTime}ms`);

    // 2. Check actual data returned by the trend endpoint
    console.log('\n📊 ENDPOINT: drug-spend-trend (full query)');
    const trendDataStart = Date.now();
    const trendData = await querySnowflake(
      `SELECT
        YEAR,
        QUARTER,
        PROGRAM,
        TOTAL_SPEND,
        MEMBER_MONTHS,
        PMPM
      FROM STAGING_ANALYTICS.DRUG_SPEND_QUARTERLY_TREND
      ORDER BY YEAR DESC, QUARTER DESC, PROGRAM`,
      config
    );
    const trendDataTime = Date.now() - trendDataStart;
    const trendPayloadSize = JSON.stringify(trendData).length;
    console.log(`  Rows returned: ${trendData.length}`);
    console.log(`  Payload size: ${(trendPayloadSize / 1024).toFixed(2)} KB`);
    console.log(`  Query time: ${trendDataTime}ms`);

    // 3. Check row counts and duplicates for DRUG_SPEND_BY_CATEGORY
    console.log('\n📊 TABLE: DRUG_SPEND_BY_CATEGORY');
    const categoryStart = Date.now();
    const categoryCount = await querySnowflake<{ TOTAL: number; DISTINCT_ROWS: number }>(
      `SELECT
        COUNT(*) AS TOTAL,
        COUNT(DISTINCT (YEAR || QUARTER || PROGRAM || CATEGORY || CATEGORY_RANK || TOTAL_SPEND || PCT_OF_TOTAL)) AS DISTINCT_ROWS
      FROM STAGING_ANALYTICS.DRUG_SPEND_BY_CATEGORY`,
      config
    );
    const categoryTime = Date.now() - categoryStart;
    console.log(`  Total rows: ${categoryCount[0].TOTAL}`);
    console.log(`  Distinct rows: ${categoryCount[0].DISTINCT_ROWS}`);
    console.log(`  Duplicates: ${categoryCount[0].TOTAL - categoryCount[0].DISTINCT_ROWS}`);
    console.log(`  Query time: ${categoryTime}ms`);

    // 4. Check actual data returned by the categories endpoint
    console.log('\n📊 ENDPOINT: drug-spend-categories (full query)');
    const categoryDataStart = Date.now();
    const categoryData = await querySnowflake(
      `SELECT
        YEAR,
        QUARTER,
        PROGRAM,
        CATEGORY,
        CATEGORY_RANK,
        TOTAL_SPEND,
        PCT_OF_TOTAL
      FROM STAGING_ANALYTICS.DRUG_SPEND_BY_CATEGORY
      ORDER BY YEAR DESC, QUARTER DESC, PROGRAM, CATEGORY_RANK`,
      config
    );
    const categoryDataTime = Date.now() - categoryDataStart;
    const categoryPayloadSize = JSON.stringify(categoryData).length;
    console.log(`  Rows returned: ${categoryData.length}`);
    console.log(`  Payload size: ${(categoryPayloadSize / 1024).toFixed(2)} KB`);
    console.log(`  Query time: ${categoryDataTime}ms`);

    // 5. Check TOP_DRIVERS table
    console.log('\n📊 TABLE: DRUG_SPEND_TOP_DRIVERS');
    const driversStart = Date.now();
    const driversCount = await querySnowflake<{ TOTAL: number }>(
      `SELECT COUNT(*) AS TOTAL FROM STAGING_ANALYTICS.DRUG_SPEND_TOP_DRIVERS`,
      config
    );
    const driversTime = Date.now() - driversStart;
    console.log(`  Total rows: ${driversCount[0].TOTAL}`);
    console.log(`  Query time: ${driversTime}ms`);

    // 6. Check SUMMARY_KPIS table
    console.log('\n📊 TABLE: DRUG_SPEND_SUMMARY_KPIS');
    const summaryStart = Date.now();
    const summaryCount = await querySnowflake<{ TOTAL: number }>(
      `SELECT COUNT(*) AS TOTAL FROM STAGING_ANALYTICS.DRUG_SPEND_SUMMARY_KPIS`,
      config
    );
    const summaryTime = Date.now() - summaryStart;
    console.log(`  Total rows: ${summaryCount[0].TOTAL}`);
    console.log(`  Query time: ${summaryTime}ms`);

    // 7. Summary
    console.log('\n' + '='.repeat(60));
    console.log('📋 SUMMARY');
    console.log('='.repeat(60));
    const totalPayload = (trendPayloadSize + categoryPayloadSize) / 1024;
    const totalTime = trendDataTime + categoryDataTime + driversTime + summaryTime;
    console.log(`\nTotal payload size (trend + categories): ${totalPayload.toFixed(2)} KB`);
    console.log(`Total query time (all 4 endpoints): ~${totalTime}ms`);
    console.log(`\n⚠️  ISSUES IDENTIFIED:`);
    if (trendData.length > 100) {
      console.log(`  - Trend endpoint returns ${trendData.length} rows (no pagination)`);
    }
    if (categoryData.length > 100) {
      console.log(`  - Categories endpoint returns ${categoryData.length} rows (no pagination)`);
    }
    if (trendCount[0].TOTAL !== trendCount[0].DISTINCT_ROWS) {
      console.log(`  - Trend table has ${trendCount[0].TOTAL - trendCount[0].DISTINCT_ROWS} duplicate rows`);
    }
    if (categoryCount[0].TOTAL !== categoryCount[0].DISTINCT_ROWS) {
      console.log(`  - Categories table has ${categoryCount[0].TOTAL - categoryCount[0].DISTINCT_ROWS} duplicate rows`);
    }

  } catch (error) {
    console.error('❌ Error running diagnosis:', error);
    process.exit(1);
  }
}

diagnose();
