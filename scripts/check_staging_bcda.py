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
    print("BCDA Staging View Row Counts")
    print("="*60)

    cursor.execute("""
        SELECT 'stg_bcda__patients' AS VIEW_NAME, COUNT(*) AS ROW_COUNT
        FROM DEV_DB.STAGING_STAGING.stg_bcda__patients
        UNION ALL
        SELECT 'stg_bcda__claims', COUNT(*)
        FROM DEV_DB.STAGING_STAGING.stg_bcda__claims
        UNION ALL
        SELECT 'stg_bcda__coverage', COUNT(*)
        FROM DEV_DB.STAGING_STAGING.stg_bcda__coverage
    """)

    results = cursor.fetchall()
    for row in results:
        view_name = row[0]
        row_count = row[1]
        print(f"{view_name:40} {row_count:>15,}")

    print("="*60)

    # Sample patient data
    print("\nSample stg_bcda__patients (first 3 rows):")
    cursor.execute("""
        SELECT patient_id, first_name, last_name, gender, birth_date
        FROM DEV_DB.STAGING_STAGING.stg_bcda__patients
        LIMIT 3
    """)
    results = cursor.fetchall()
    for row in results:
        print(f"  {row}")

    cursor.close()
finally:
    conn.close()
