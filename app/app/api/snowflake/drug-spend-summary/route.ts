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
        PARTD_SPENDING,
        PARTD_CLAIMS,
        PARTD_BENEFICIARIES,
        PARTD_UNIQUE_DRUGS,
        PARTB_SPENDING,
        PARTB_CLAIMS,
        PARTB_BENEFICIARIES,
        PARTB_UNIQUE_DRUGS,
        COMBINED_TOTAL_SPENDING,
        COMBINED_TOTAL_CLAIMS,
        COMBINED_TOTAL_BENEFICIARIES,
        COMBINED_UNIQUE_DRUGS,
        PARTD_QOQ_CHANGE_PCT,
        PARTB_QOQ_CHANGE_PCT,
        COMBINED_QOQ_CHANGE_PCT,
        TOP_DRUG_BRAND,
        TOP_DRUG_GENERIC,
        TOP_DRUG_SPENDING,
        TOP_DRUG_PROGRAM
      FROM STAGING_analytics.DRUG_SPEND_SUMMARY_KPIS
      LIMIT 1
    `;

    const data = await querySnowflake(sql, config);

    return NextResponse.json({ success: true, data: data[0] || {} });
  } catch (error) {
    console.error('Snowflake query error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch drug spending summary' },
      { status: 500 }
    );
  }
}
