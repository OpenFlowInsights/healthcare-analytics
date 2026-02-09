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

    print("Describing S3_BCDA_STAGE...")
    cursor.execute("DESCRIBE STAGE DEV_DB.RAW.S3_BCDA_STAGE")
    for row in cursor.fetchall():
        print(f"  {row[0]}: {row[1]}")

    print("\nShowing stage details...")
    cursor.execute("SHOW STAGES LIKE 'S3_BCDA_STAGE' IN DEV_DB.RAW")
    stages = cursor.fetchall()
    if stages:
        print(f"URL: {stages[0][4]}")
        print(f"Storage Integration: {stages[0][10]}")

    cursor.close()
    conn.close()

except Exception as e:
    print(f"✗ Error: {e}")
