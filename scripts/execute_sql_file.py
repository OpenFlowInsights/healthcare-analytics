#!/usr/bin/env python3
"""Execute SQL file in Snowflake"""
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

    print("Reading SQL file...")
    with open('/home/ubuntu/projects/healthcare-analytics/load_cms_p1_full.sql', 'r') as f:
        sql_content = f.read()

    # Split by semicolon to get individual statements
    statements = [s.strip() for s in sql_content.split(';') if s.strip() and not s.strip().startswith('--')]

    print(f"Executing {len(statements)} SQL statements...\n")

    success_count = 0
    error_count = 0

    for i, statement in enumerate(statements, 1):
        # Skip comments and empty lines
        if not statement or statement.startswith('--'):
            continue

        # Show progress every 10 statements
        if i % 10 == 0:
            print(f"Progress: {i}/{len(statements)} statements...")

        try:
            cursor.execute(statement)

            # For COPY commands, get the results
            if 'COPY INTO' in statement.upper():
                results = cursor.fetchall()
                if results and len(results) > 0:
                    rows_loaded = results[0][1] if len(results[0]) > 1 else 0
                    if rows_loaded > 0:
                        table_name = statement.split('COPY INTO')[1].split('FROM')[0].strip().split('.')[-1]
                        print(f"  ✓ {table_name}: {rows_loaded:,} rows")

            success_count += 1

        except Exception as e:
            error_count += 1
            error_msg = str(e)
            if len(error_msg) > 100:
                error_msg = error_msg[:100] + "..."
            print(f"  ✗ Statement {i}: {error_msg}")

    cursor.close()
    conn.close()

    print(f"\n{'='*80}")
    print(f"Execution Complete!")
    print(f"  Success: {success_count}")
    print(f"  Errors: {error_count}")
    print(f"{'='*80}")

except Exception as e:
    print(f"Fatal error: {e}")
