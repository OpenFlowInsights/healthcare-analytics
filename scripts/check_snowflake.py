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

    print("Checking stages in DEV_DB.RAW...")
    cursor.execute("SHOW STAGES IN DEV_DB.RAW")
    stages = cursor.fetchall()
    for stage in stages:
        print(f"  Stage: {stage[1]}")  # stage name is at index 1

    if not stages:
        print("  No stages found!")

    print("\nChecking storage integrations...")
    cursor.execute("SHOW INTEGRATIONS")
    integrations = cursor.fetchall()
    for integration in integrations:
        print(f"  Integration: {integration[1]} (Type: {integration[2]})")

    cursor.close()
finally:
    conn.close()
