#!/usr/bin/env python3
"""
Create Snowflake tables from CSV files and load data.
Reads CSV headers to infer schema automatically.
"""
import snowflake.connector
import os
import json
import csv
from pathlib import Path

# Connect to Snowflake
conn = snowflake.connector.connect(
    account=os.getenv('SNOWFLAKE_ACCOUNT', 'RRISPXQ-JUC46944'),
    user=os.getenv('SNOWFLAKE_USERNAME', 'APP_SERVICE'),
    password=os.getenv('SNOWFLAKE_PASSWORD'),
    warehouse=os.getenv('SNOWFLAKE_WAREHOUSE', 'DEV_WH'),
    database=os.getenv('SNOWFLAKE_DATABASE', 'DEV_DB'),
    role='ACCOUNTADMIN'
)

def sanitize_column_name(col):
    """Convert column name to valid Snowflake identifier"""
    # Remove BOM and strip
    col = col.strip().lstrip('\ufeff')
    # Replace special chars with underscore or remove
    replacements = {
        ' ': '_', '-': '_', '.': '_', '/': '_',
        '%': 'PCT', '#': 'NUM', '&': 'AND',
        '+': 'PLUS', '*': 'STAR', '=': 'EQ',
        '(': '', ')': '', '[': '', ']': '',
        '{': '', '}': '', '<': '', '>': '',
        '!': '', '@': '', '$': '', '^': '',
        '|': '', '\\': '', ':': '', ';': '',
        ',': '', '?': '', '~': '', '`': '',
        '"': '', "'": ''
    }
    for old, new in replacements.items():
        col = col.replace(old, new)
    # Remove consecutive underscores
    while '__' in col:
        col = col.replace('__', '_')
    col = col.strip('_')
    # Ensure it starts with a letter
    if not col or col[0].isdigit():
        col = 'COL_' + col
    return col.upper()

def get_table_name(file_path):
    """Generate Snowflake table name from file path"""
    category = file_path.parent.name.upper()
    filename = file_path.stem
    # Sanitize filename
    table_name = sanitize_column_name(filename)
    return f"CMS_{category}_{table_name}"

def get_csv_columns(file_path):
    """Read CSV headers and return column definitions"""
    with open(file_path, 'r', encoding='utf-8-sig', errors='ignore') as f:
        reader = csv.reader(f)
        headers = next(reader)
        # Sanitize column names
        columns = [sanitize_column_name(h) for h in headers]
        # All columns as VARCHAR for simplicity
        return [(col, 'VARCHAR(16777216)') for col in columns if col]

def create_table(cursor, table_name, columns):
    """Create table in Snowflake"""
    col_defs = ', '.join([f"{col} {dtype}" for col, dtype in columns])
    sql = f"""
    CREATE TABLE IF NOT EXISTS DEV_DB.RAW.{table_name} (
        {col_defs}
    )
    """
    try:
        cursor.execute(sql)
        return True
    except Exception as e:
        print(f"  ✗ Failed to create table: {e}")
        return False

def load_data(cursor, table_name, s3_path):
    """Load data from S3 into table"""
    sql = f"""
    COPY INTO DEV_DB.RAW.{table_name}
    FROM @DEV_DB.RAW.S3_BCDA_STAGE/{s3_path}
    FILE_FORMAT = (TYPE = 'CSV' SKIP_HEADER = 1 FIELD_OPTIONALLY_ENCLOSED_BY = '"'
                   NULL_IF = ('NULL', 'null', '') ERROR_ON_COLUMN_COUNT_MISMATCH = FALSE)
    ON_ERROR = CONTINUE
    """
    try:
        cursor.execute(sql)
        results = cursor.fetchall()
        if results and len(results) > 0:
            rows_loaded = results[0][1] if len(results[0]) > 1 else 0
            return int(rows_loaded) if rows_loaded is not None else 0
        return 0
    except Exception as e:
        error_msg = str(e)
        print(f"  ✗ Failed to load data: {error_msg[:200]}")
        return -1

def main():
    # Read P1 download results
    results_file = Path.home() / 'data/cms/data_download_results.json'
    with open(results_file, 'r') as f:
        results = json.load(f)

    cursor = conn.cursor()

    print(f"\n{'='*80}")
    print(f"Creating Tables and Loading CMS P1 Data")
    print(f"{'='*80}\n")

    success_count = 0
    error_count = 0
    total_rows = 0

    # Filter only successful CSV downloads
    successful_items = [item for item in results if item.get('status') == 'complete' and item.get('type') == 'csv_download']

    for item in successful_items:
        file_path = Path(item['filepath'])

        # Skip if file doesn't exist
        if not file_path.exists():
            print(f"⚠ File not found: {file_path}")
            continue

        # Generate table name
        table_name = get_table_name(file_path)

        # Get columns from CSV
        try:
            columns = get_csv_columns(file_path)
        except Exception as e:
            print(f"✗ {table_name}: Failed to read CSV - {e}")
            error_count += 1
            continue

        print(f"[{success_count + error_count + 1}] {table_name}")

        # Create table
        if not create_table(cursor, table_name, columns):
            error_count += 1
            continue

        # Calculate S3 path
        category = file_path.parent.name
        filename = file_path.name
        s3_path = f"cms-data/{category}/{filename}"

        # Load data
        rows = load_data(cursor, table_name, s3_path)
        if rows > 0:
            print(f"  ✓ Loaded {rows:,} rows")
            success_count += 1
            total_rows += rows
        elif rows == 0:
            print(f"  ⚠ No rows loaded (check S3 path)")
            error_count += 1
        else:
            # rows == -1, error already printed
            error_count += 1

    cursor.close()
    conn.close()

    print(f"\n{'='*80}")
    print(f"Summary:")
    print(f"  Tables processed: {len(successful_items)}")
    print(f"  Successful: {success_count}")
    print(f"  Errors: {error_count}")
    print(f"  Total rows loaded: {total_rows:,}")
    print(f"{'='*80}")

if __name__ == '__main__':
    main()
