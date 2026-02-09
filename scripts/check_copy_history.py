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
    print("Recent COPY INTO History")
    print("="*80)

    cursor.execute("""
        SELECT
            TABLE_NAME,
            FILE_NAME,
            ROW_COUNT,
            ROW_PARSED,
            ERROR_COUNT,
            STATUS,
            FIRST_ERROR_MESSAGE,
            LAST_LOAD_TIME
        FROM TABLE(INFORMATION_SCHEMA.COPY_HISTORY(
            TABLE_NAME=>'DEV_DB.RAW.RAW_BCDA_PATIENT',
            START_TIME=>DATEADD(HOURS, -1, CURRENT_TIMESTAMP())
        ))
        ORDER BY LAST_LOAD_TIME DESC
        LIMIT 10
    """)

    print("\nRAW_BCDA_PATIENT:")
    results = cursor.fetchall()
    if results:
        for row in results:
            print(f"  File: {row[1]}")
            print(f"  Rows Loaded: {row[2]}, Parsed: {row[3]}, Errors: {row[4]}")
            print(f"  Status: {row[5]}")
            if row[6]:
                print(f"  Error: {row[6]}")
            print()
    else:
        print("  No COPY history found")

    # Check ExplanationOfBenefit
    cursor.execute("""
        SELECT
            TABLE_NAME,
            FILE_NAME,
            ROW_COUNT,
            ROW_PARSED,
            ERROR_COUNT,
            STATUS,
            FIRST_ERROR_MESSAGE,
            LAST_LOAD_TIME
        FROM TABLE(INFORMATION_SCHEMA.COPY_HISTORY(
            TABLE_NAME=>'DEV_DB.RAW.RAW_BCDA_EXPLANATION_OF_BENEFIT',
            START_TIME=>DATEADD(HOURS, -1, CURRENT_TIMESTAMP())
        ))
        ORDER BY LAST_LOAD_TIME DESC
        LIMIT 10
    """)

    print("\nRAW_BCDA_EXPLANATION_OF_BENEFIT:")
    results = cursor.fetchall()
    if results:
        for row in results:
            print(f"  File: {row[1]}")
            print(f"  Rows Loaded: {row[2]}, Parsed: {row[3]}, Errors: {row[4]}")
            print(f"  Status: {row[5]}")
            if row[6]:
                print(f"  Error: {row[6]}")
            print()
    else:
        print("  No COPY history found")

    # Check Coverage
    cursor.execute("""
        SELECT
            TABLE_NAME,
            FILE_NAME,
            ROW_COUNT,
            ROW_PARSED,
            ERROR_COUNT,
            STATUS,
            FIRST_ERROR_MESSAGE,
            LAST_LOAD_TIME
        FROM TABLE(INFORMATION_SCHEMA.COPY_HISTORY(
            TABLE_NAME=>'DEV_DB.RAW.RAW_BCDA_COVERAGE',
            START_TIME=>DATEADD(HOURS, -1, CURRENT_TIMESTAMP())
        ))
        ORDER BY LAST_LOAD_TIME DESC
        LIMIT 10
    """)

    print("\nRAW_BCDA_COVERAGE:")
    results = cursor.fetchall()
    if results:
        for row in results:
            print(f"  File: {row[1]}")
            print(f"  Rows Loaded: {row[2]}, Parsed: {row[3]}, Errors: {row[4]}")
            print(f"  Status: {row[5]}")
            if row[6]:
                print(f"  Error: {row[6]}")
            print()
    else:
        print("  No COPY history found")

    print("="*80)

    cursor.close()
finally:
    conn.close()
