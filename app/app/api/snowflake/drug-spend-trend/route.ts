import { NextRequest, NextResponse } from 'next/server';
import { getSnowflakeConfig, querySnowflake } from '@/lib/snowflake';

export async function GET(request: NextRequest) {
  try {
    const config = getSnowflakeConfig();

    const sql = `
      SELECT
        YEAR,
        QUARTER,
        PERIOD,
        PROGRAM,
        TOTAL_SPENDING,
        TOTAL_CLAIMS,
        TOTAL_BENEFICIARIES,
        AVG_COST_PER_CLAIM,
        AVG_COST_PER_BENEFICIARY,
        QOQ_CHANGE_PCT,
        YOY_CHANGE_PCT,
        ROLLING_AVG_4Q
      FROM STAGING_analytics.DRUG_SPEND_QUARTERLY_TREND
      ORDER BY YEAR DESC, QUARTER DESC, PROGRAM
    `;

    const data = await querySnowflake(sql, config);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Snowflake query error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch drug spending trend' },
      { status: 500 }
    );
  }
}
