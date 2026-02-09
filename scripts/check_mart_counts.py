#!/usr/bin/env python3
import snowflake.connector
import os

conn = snowflake.connector.connect(
    account=os.getenv('SNOWFLAKE_ACCOUNT', 'RRISPXQ-JUC46944'),
    user=os.getenv('SNOWFLAKE_USERNAME', 'APP_SERVICE'),
    password=os.getenv('SNOWFLAKE_PASSWORD'),
    warehouse=os.getenv('SNOWFLAKE_WAREHOUSE', 'DEV_WH'),
    database=os.getenv('SNOWFLAKE_DATABASE', 'DEV_DB'),
    role='ACCOUNTADMIN'
)

try:
    cursor = conn.cursor()

    print("\n" + "="*60)
    print("Mart Table Row Counts")
    print("="*60)

    cursor.execute("""
        SELECT 'aco_performance_summary' AS TABLE_NAME, COUNT(*) AS ROW_COUNT
        FROM DEV_DB.STAGING_ANALYTICS.aco_performance_summary
        UNION ALL
        SELECT 'member_summary', COUNT(*)
        FROM DEV_DB.STAGING_ANALYTICS.member_summary
        UNION ALL
        SELECT 'dashboard_summary', COUNT(*)
        FROM DEV_DB.STAGING_ANALYTICS.dashboard_summary
        UNION ALL
        SELECT 'dashboard_aco_rankings', COUNT(*)
        FROM DEV_DB.STAGING_ANALYTICS.dashboard_aco_rankings
        UNION ALL
        SELECT 'dashboard_track_comparison', COUNT(*)
        FROM DEV_DB.STAGING_ANALYTICS.dashboard_track_comparison
    """)

    results = cursor.fetchall()
    for row in results:
        table_name = row[0]
        row_count = row[1]
        print(f"{table_name:40} {row_count:>15,}")

    print("="*60)

    # Show sample member data
    print("\nSample member_summary data (first 5 rows):")
    print("-" * 80)
    cursor.execute("""
        SELECT
            patient_id,
            gender,
            age,
            total_claims,
            total_paid,
            high_utilizer
        FROM DEV_DB.STAGING_ANALYTICS.member_summary
        LIMIT 5
    """)

    results = cursor.fetchall()
    if results:
        print(f"{'Patient ID':20} {'Gender':10} {'Age':5} {'Claims':10} {'Total Paid':15} {'High Util':10}")
        print("-" * 80)
        for row in results:
            patient_id = row[0] if row[0] else 'N/A'
            gender = row[1] if row[1] else 'N/A'
            age = row[2] if row[2] is not None else 'N/A'
            claims = row[3] if row[3] is not None else 0
            paid = row[4] if row[4] is not None else 0
            high_util = 'Yes' if row[5] == 1 else 'No'
            print(f"{patient_id[:20]:20} {str(gender):10} {str(age):5} {claims:10} ${paid:14,.2f} {high_util:10}")
    else:
        print("No data found")

    cursor.close()
finally:
    conn.close()
