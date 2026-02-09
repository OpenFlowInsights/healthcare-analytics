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

    print("\n" + "="*80)
    print("Checking S3_BCDA_STAGE configuration")
    print("="*80)

    # Describe the stage
    cursor.execute("DESC STAGE DEV_DB.RAW.S3_BCDA_STAGE")
    stage_info = cursor.fetchall()
    print("\nStage Properties:")
    for row in stage_info:
        print(f"  {row[0]}: {row[1]}")

    # List files in patients directory
    print("\n" + "="*80)
    print("Files in @S3_BCDA_STAGE/patients/")
    print("="*80)
    cursor.execute("LIST @DEV_DB.RAW.S3_BCDA_STAGE/patients/")
    patient_files = cursor.fetchall()
    if patient_files:
        for row in patient_files:
            print(f"  {row[0]} - Size: {row[1]} bytes")
    else:
        print("  No files found")

    # List files in eob directory
    print("\n" + "="*80)
    print("Files in @S3_BCDA_STAGE/eob/ (first 10)")
    print("="*80)
    cursor.execute("LIST @DEV_DB.RAW.S3_BCDA_STAGE/eob/")
    eob_files = cursor.fetchall()
    if eob_files:
        for row in eob_files[:10]:  # Show first 10
            print(f"  {row[0]} - Size: {row[1]} bytes")
        if len(eob_files) > 10:
            print(f"  ... and {len(eob_files) - 10} more files")
    else:
        print("  No files found")

    # List files in coverage directory
    print("\n" + "="*80)
    print("Files in @S3_BCDA_STAGE/coverage/")
    print("="*80)
    cursor.execute("LIST @DEV_DB.RAW.S3_BCDA_STAGE/coverage/")
    coverage_files = cursor.fetchall()
    if coverage_files:
        for row in coverage_files:
            print(f"  {row[0]} - Size: {row[1]} bytes")
    else:
        print("  No files found")

    print("\n" + "="*80)

    cursor.close()
finally:
    conn.close()
