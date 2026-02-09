import { NextRequest, NextResponse } from 'next/server';
import { getSnowflakeConfig, querySnowflake } from '@/lib/snowflake';

export async function GET(request: NextRequest) {
  try {
    const config = getSnowflakeConfig();
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '20';

    const sql = `
      SELECT
        ACO_ID,
        ACO_NAME,
        ACO_STATE,
        ACO_TRACK,
        TOTAL_BENEFICIARIES,
        SAVINGS_RATE_PCT,
        QUALITY_SCORE,
        SAVINGS_RATE_RANK,
        PERFORMANCE_CATEGORY
      FROM DASHBOARD_ACO_RANKINGS
      ORDER BY SAVINGS_RATE_RANK
      LIMIT ${limit}
    `;

    const data = await querySnowflake(sql, config);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Snowflake query error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch ACO rankings' },
      { status: 500 }
    );
  }
}
