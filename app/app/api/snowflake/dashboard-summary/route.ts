import { NextRequest, NextResponse } from 'next/server';
import { getSnowflakeConfig, querySnowflake } from '@/lib/snowflake';

export async function GET(request: NextRequest) {
  try {
    const config = getSnowflakeConfig();

    const sql = `
      SELECT
        TOTAL_ACOS,
        ACOS_WITH_SAVINGS,
        ACOS_WITH_LOSSES,
        TOTAL_BENEFICIARIES,
        TOTAL_BENCHMARK_EXPENDITURE,
        TOTAL_ACTUAL_EXPENDITURE,
        TOTAL_SAVINGS_LOSSES,
        AVG_SAVINGS_RATE_PCT,
        AVG_QUALITY_SCORE
      FROM DASHBOARD_SUMMARY
      LIMIT 1
    `;

    const data = await querySnowflake(sql, config);

    return NextResponse.json({ success: true, data: data[0] || {} });
  } catch (error) {
    console.error('Snowflake query error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard summary' },
      { status: 500 }
    );
  }
}
