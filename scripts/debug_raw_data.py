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

    print("\nChecking RAW_BCDA_PATIENT table:")
    cursor.execute("SELECT COUNT(*) FROM DEV_DB.RAW.RAW_BCDA_PATIENT")
    count = cursor.fetchone()[0]
    print(f"Total rows: {count}")

    print("\nDescribing table structure:")
    cursor.execute("DESC TABLE DEV_DB.RAW.RAW_BCDA_PATIENT")
    for row in cursor.fetchall():
        print(f"  {row[0]}: {row[1]}")

    print("\nChecking first row (showing all columns):")
    cursor.execute("SELECT * FROM DEV_DB.RAW.RAW_BCDA_PATIENT LIMIT 1")
    columns = [col[0] for col in cursor.description]
    print(f"Columns: {columns}")

    row = cursor.fetchone()
    if row:
        for i, col in enumerate(columns):
            val = row[i]
            print(f"{col}: {val if val else 'NULL'} (type: {type(val).__name__})")
    else:
        print("No rows found")

    cursor.close()
finally:
    conn.close()
