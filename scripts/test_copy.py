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

    with open('/home/ubuntu/projects/healthcare-analytics/test_copy_one_file.sql', 'r') as f:
        sql_commands = f.read()

    statements = [s.strip() for s in sql_commands.split(';') if s.strip()]

    for i, statement in enumerate(statements, 1):
        print(f"\n{'='*80}")
        print(f"Statement {i}:")
        print(f"{'='*80}")
        print(statement[:200] + ('...' if len(statement) > 200 else ''))
        print()

        try:
            cursor.execute(statement)

            if statement.strip().upper().startswith('SELECT'):
                results = cursor.fetchall()
                for row in results:
                    print(row)
            elif statement.strip().upper().startswith('COPY'):
                # For COPY command, show rowcount
                print(f"Rows processed: {cursor.rowcount}")
                # Get copy results
                for row in cursor:
                    print(row)
            else:
                print(f"Success - Rows affected: {cursor.rowcount}")

        except Exception as e:
            print(f"Error: {e}")

    cursor.close()
finally:
    conn.close()
