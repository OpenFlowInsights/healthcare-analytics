#!/usr/bin/env python3
import snowflake.connector
import os
import json

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

    print("\n" + "="*80)
    print("Sample FHIR Patient Data Structure")
    print("="*80)

    cursor.execute("""
        SELECT DATA
        FROM DEV_DB.RAW.RAW_BCDA_PATIENT
        LIMIT 1
    """)

    result = cursor.fetchone()
    if result:
        data = result[0]
        if isinstance(data, str):
            data = json.loads(data)
        print(json.dumps(data, indent=2))
    else:
        print("No data found")

    cursor.close()
finally:
    conn.close()
