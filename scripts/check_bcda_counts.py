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
    print("BCDA Table Row Counts")
    print("="*60)

    cursor.execute("""
        SELECT 'RAW_BCDA_PATIENT' AS TABLE_NAME, COUNT(*) AS ROW_COUNT
        FROM DEV_DB.RAW.RAW_BCDA_PATIENT
        UNION ALL
        SELECT 'RAW_BCDA_EXPLANATION_OF_BENEFIT', COUNT(*)
        FROM DEV_DB.RAW.RAW_BCDA_EXPLANATION_OF_BENEFIT
        UNION ALL
        SELECT 'RAW_BCDA_COVERAGE', COUNT(*)
        FROM DEV_DB.RAW.RAW_BCDA_COVERAGE
    """)

    results = cursor.fetchall()
    for row in results:
        table_name = row[0]
        row_count = row[1]
        print(f"{table_name:40} {row_count:>15,}")

    print("="*60)

    cursor.close()
finally:
    conn.close()
