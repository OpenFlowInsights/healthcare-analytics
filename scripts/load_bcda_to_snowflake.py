#!/usr/bin/env python3
import snowflake.connector
import os

# Read SQL files
print("Step 1: Creating BCDA tables...")
with open('/home/ubuntu/projects/healthcare-analytics/create_bcda_tables.sql', 'r') as f:
    create_tables_sql = f.read()

print("Step 2: Loading BCDA data...")
with open('/home/ubuntu/projects/healthcare-analytics/load_bcda_data.sql', 'r') as f:
    load_data_sql = f.read()

# Combine SQL commands
sql_commands = create_tables_sql + '\n\n' + load_data_sql

# Split into individual statements
statements = [s.strip() for s in sql_commands.split(';') if s.strip()]

# Connect to Snowflake
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

    for i, statement in enumerate(statements, 1):
        print(f"\n{'='*60}")
        print(f"Executing statement {i}/{len(statements)}:")
        print(f"{'='*60}")
        print(statement[:200] + ('...' if len(statement) > 200 else ''))
        print()

        try:
            cursor.execute(statement)

            # Fetch results if it's a SELECT
            if statement.strip().upper().startswith('SELECT'):
                results = cursor.fetchall()
                for row in results:
                    print(row)
            else:
                print(f"✓ Rows affected: {cursor.rowcount}")

        except Exception as e:
            print(f"✗ Error: {e}")
            continue

    cursor.close()

finally:
    conn.close()

print(f"\n{'='*60}")
print("BCDA data load complete!")
print(f"{'='*60}")
