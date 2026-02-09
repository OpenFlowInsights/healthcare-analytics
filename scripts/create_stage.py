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

    print("Creating S3_CMS_STAGE...")
    cursor.execute("""
        CREATE OR REPLACE STAGE DEV_DB.RAW.S3_CMS_STAGE
          URL = 's3://ofi-healthcare-data/cms-data/'
          STORAGE_INTEGRATION = EXTERNAL_STAGE
    """)
    print("✓ Stage created")

    print("\nTesting stage...")
    cursor.execute("LIST @DEV_DB.RAW.S3_CMS_STAGE/aco/")
    files = cursor.fetchall()
    print(f"✓ Found {len(files)} files in aco/ directory")
    for f in files[:5]:
        print(f"  {f[0]}")

    cursor.close()
    conn.close()
    print("\n✓ Stage ready for loading")

except Exception as e:
    print(f"✗ Error: {e}")
