import { NextRequest, NextResponse } from 'next/server';
import { getSnowflakeConfig, querySnowflake } from '@/lib/snowflake';

export async function GET(request: NextRequest) {
  try {
    const config = getSnowflakeConfig();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const program = searchParams.get('program'); // Optional: 'Part D', 'Part B', or null for both

    let sql = `
      SELECT
        YEAR,
        QUARTER,
        PERIOD,
        PROGRAM,
        CATEGORY,
        DRUG_COUNT,
        TOTAL_SPENDING,
        TOTAL_CLAIMS,
        TOTAL_BENEFICIARIES,
        AVG_SPENDING_PER_DRUG,
        AVG_COST_PER_CLAIM,
        PCT_OF_PROGRAM_SPEND,
        CATEGORY_RANK
      FROM STAGING_analytics.DRUG_SPEND_BY_CATEGORY
    `;

    // Add program filter if specified
    if (program) {
      sql += ` WHERE PROGRAM = '${program.replace(/'/g, "''")}'`;
    }

    sql += ` ORDER BY YEAR DESC, QUARTER DESC, PROGRAM, CATEGORY_RANK`;

    const data = await querySnowflake(sql, config);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Snowflake query error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch drug spending by category' },
      { status: 500 }
    );
  }
}
