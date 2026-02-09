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

    print("Creating CSV file format...")
    cursor.execute("""
        CREATE OR REPLACE FILE FORMAT DEV_DB.RAW.CSV_FORMAT
        TYPE = 'CSV'
        SKIP_HEADER = 1
        FIELD_OPTIONALLY_ENCLOSED_BY = '"'
        NULL_IF = ('NULL', 'null', '')
        ERROR_ON_COLUMN_COUNT_MISMATCH = FALSE
    """)
    print("✓ CSV_FORMAT created")

    cursor.close()
    conn.close()

except Exception as e:
    print(f"✗ Error: {e}")
