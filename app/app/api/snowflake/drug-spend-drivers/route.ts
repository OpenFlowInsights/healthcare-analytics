import { NextRequest, NextResponse } from 'next/server';
import { getSnowflakeConfig, querySnowflake } from '@/lib/snowflake';

export async function GET(request: NextRequest) {
  try {
    const config = getSnowflakeConfig();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '25', 10);
    const sortBy = searchParams.get('sortBy') || 'total_spending';
    const sortOrder = searchParams.get('sortOrder') || 'DESC';
    const program = searchParams.get('program'); // Optional: 'Part D', 'Part B', or null for both

    // Validate sortBy to prevent SQL injection
    const validSortFields = [
      'total_spending',
      'qoq_growth_pct',
      'avg_spending_per_claim',
      'total_claims',
      'pct_of_total_spend'
    ];
    const orderByField = validSortFields.includes(sortBy) ? sortBy : 'total_spending';
    const orderDirection = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    let sql = `
      SELECT
        BRAND_NAME,
        GENERIC_NAME,
        PROGRAM,
        YEAR,
        QUARTER,
        TOTAL_SPENDING,
        TOTAL_CLAIMS,
        TOTAL_BENEFICIARIES,
        AVG_SPENDING_PER_CLAIM,
        AVG_SPENDING_PER_BENEFICIARY,
        QOQ_GROWTH_PCT,
        PCT_OF_TOTAL_SPEND,
        SPENDING_CHANGE_DOLLARS,
        SPEND_RANK
      FROM STAGING_analytics.DRUG_SPEND_TOP_DRIVERS
    `;

    // Add program filter if specified
    if (program) {
      sql += ` WHERE PROGRAM = '${program.replace(/'/g, "''")}'`;
    }

    sql += ` ORDER BY ${orderByField} ${orderDirection}`;
    sql += ` LIMIT ${limit}`;

    const data = await querySnowflake(sql, config);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Snowflake query error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch top drug drivers' },
      { status: 500 }
    );
  }
}
