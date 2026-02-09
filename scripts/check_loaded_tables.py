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

    # Get all CMS tables
    cursor.execute("SHOW TABLES LIKE 'CMS_%' IN DEV_DB.RAW")
    tables = cursor.fetchall()

    print(f"\n{'='*80}")
    print(f"CMS Tables in Snowflake: {len(tables)}")
    print(f"{'='*80}\n")

    loaded_tables = []
    empty_tables = []

    for table in tables:
        table_name = table[1]

        # Check row count
        cursor.execute(f"SELECT COUNT(*) FROM DEV_DB.RAW.{table_name}")
        count = cursor.fetchone()[0]

        if count > 0:
            loaded_tables.append((table_name, count))
        else:
            empty_tables.append(table_name)

    # Show loaded tables
    print(f"Tables with Data ({len(loaded_tables)}):")
    print("-" * 80)
    for table_name, count in sorted(loaded_tables, key=lambda x: x[1], reverse=True)[:20]:
        print(f"  {table_name[:60]:60} {count:>15,} rows")

    if len(loaded_tables) > 20:
        print(f"  ... and {len(loaded_tables) - 20} more tables with data")

    print(f"\nEmpty Tables: {len(empty_tables)}")

    print(f"\n{'='*80}")
    print(f"Summary:")
    print(f"  Total CMS tables: {len(tables)}")
    print(f"  Tables with data: {len(loaded_tables)}")
    print(f"  Empty tables: {len(empty_tables)}")
    print(f"{'='*80}")

    cursor.close()
    conn.close()

except Exception as e:
    print(f"Error: {e}")
