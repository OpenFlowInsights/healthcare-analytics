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

    # Show stages details
    cursor.execute("SHOW STAGES IN DEV_DB.RAW")
    stages = cursor.fetchall()

    print("\n" + "="*80)
    print("Stage Configurations")
    print("="*80)

    for stage in stages:
        stage_name = stage[1]
        url = stage[4]  # URL is typically at index 4
        print(f"\nStage: {stage_name}")
        print(f"URL: {url}")
        print(f"Type: {stage[3]}")

    print("\n" + "="*80)

    cursor.close()
finally:
    conn.close()
