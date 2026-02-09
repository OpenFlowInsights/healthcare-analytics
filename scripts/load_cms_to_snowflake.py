#!/usr/bin/env python3
"""Load CMS datasets from S3 into Snowflake"""
import os
import json
import snowflake.connector
import pandas as pd
from pathlib import Path
import time

# Snowflake connection
def get_snowflake_conn():
    return snowflake.connector.connect(
        account=os.getenv('SNOWFLAKE_ACCOUNT', 'RRISPXQ-JUC46944'),
        user=os.getenv('SNOWFLAKE_USERNAME', 'APP_SERVICE'),
        password=os.getenv('SNOWFLAKE_PASSWORD'),
        warehouse=os.getenv('SNOWFLAKE_WAREHOUSE', 'DEV_WH'),
        database=os.getenv('SNOWFLAKE_DATABASE', 'DEV_DB'),
        role='ACCOUNTADMIN'
    )

def clean_table_name(filename, category):
    """Convert filename to valid Snowflake table name"""
    name = Path(filename).stem
    # Remove special chars
    name = ''.join(c if c.isalnum() or c == '_' else '_' for c in name)
    # Remove consecutive underscores
    while '__' in name:
        name = name.replace('__', '_')
    name = name.strip('_')
    # Add prefix
    return f"CMS_{category.upper()}_{name}".upper()[:128]

def infer_column_type(series):
    """Infer Snowflake type from pandas series"""
    if pd.api.types.is_integer_dtype(series):
        return 'NUMBER(38,0)'
    elif pd.api.types.is_float_dtype(series):
        return 'FLOAT'
    elif pd.api.types.is_bool_dtype(series):
        return 'BOOLEAN'
    elif pd.api.types.is_datetime64_any_dtype(series):
        return 'TIMESTAMP_NTZ'
    else:
        # Check max length for VARCHAR
        try:
            max_len = series.astype(str).str.len().max()
            if pd.isna(max_len) or max_len < 100:
                return 'VARCHAR(500)'
            elif max_len < 1000:
                return 'VARCHAR(2000)'
            else:
                return 'VARCHAR(16777216)'
        except:
            return 'VARCHAR(16777216)'

def load_dataset(conn, category, s3_key, local_path):
    """Load a CSV from S3 into Snowflake"""
    filename = os.path.basename(s3_key)
    table_name = clean_table_name(filename, category)

    print(f"\n{'='*80}")
    print(f"Dataset: {filename}")
    print(f"Table: {table_name}")

    try:
        cursor = conn.cursor()

        # Read first 1000 rows to infer schema
        if not os.path.exists(local_path):
            print(f"  ✗ Local file not found: {local_path}")
            return False

        df = pd.read_csv(local_path, nrows=1000, low_memory=False)
        print(f"  Columns: {len(df.columns)}")

        # Clean column names
        clean_cols = []
        for col in df.columns:
            clean_col = ''.join(c if c.isalnum() or c == '_' else '_' for c in str(col))
            clean_col = clean_col.strip('_').upper()[:128]
            if not clean_col or clean_col[0].isdigit():
                clean_col = 'COL_' + clean_col
            clean_cols.append(clean_col)

        df.columns = clean_cols

        # Create table DDL
        columns = []
        for col in df.columns:
            col_type = infer_column_type(df[col])
            columns.append(f'  "{col}" {col_type}')

        # Drop table if exists
        print(f"  → Dropping old table if exists...")
        cursor.execute(f"DROP TABLE IF EXISTS DEV_DB.RAW.{table_name}")

        # Create table
        create_sql = f"""
        CREATE TABLE DEV_DB.RAW.{table_name} (
{',\n'.join(columns)},
          LOADED_AT TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
        )
        """

        print(f"  → Creating table...")
        cursor.execute(create_sql)
        print(f"  ✓ Table created")

        # COPY INTO from S3 using existing stage
        # Use S3_BCDA_STAGE which points to bucket root
        stage_path = "@DEV_DB.RAW.S3_BCDA_STAGE/" + s3_key

        copy_sql = f"COPY INTO DEV_DB.RAW.{table_name} FROM {stage_path} FILE_FORMAT = (FORMAT_NAME = 'DEV_DB.RAW.CSV_FORMAT') ON_ERROR = CONTINUE"

        print(f"  → Loading data from S3...")
        result = cursor.execute(copy_sql)
        copy_results = cursor.fetchall()

        if copy_results:
            rows_loaded = copy_results[0][1]  # rows_loaded column
            print(f"  ✓ Loaded {rows_loaded:,} rows")
        else:
            print(f"  ✓ Load completed")

        # Get row count
        cursor.execute(f"SELECT COUNT(*) FROM DEV_DB.RAW.{table_name}")
        count = cursor.fetchone()[0]
        print(f"  ✓ Final count: {count:,} rows")

        cursor.close()
        return True

    except Exception as e:
        print(f"  ✗ Error: {e}")
        conn.rollback()
        return False

def main():
    # Load download results
    with open('/home/ubuntu/data/cms/data_download_results.json') as f:
        results = json.load(f)

    print("="*80)
    print("CMS DATA → SNOWFLAKE LOAD")
    print("="*80)
    print(f"\nDatasets to load: {len(results)}")

    conn = get_snowflake_conn()

    success = 0
    failed = 0

    for item in results:
        if item['status'] != 'complete':
            continue

        filepath = item['filepath']

        # Determine category
        parts = filepath.split('/')
        if 'aco' in parts:
            category = 'aco'
        elif 'quality' in parts:
            category = 'quality'
        elif 'claims' in parts:
            category = 'claims'
        elif 'ma' in parts:
            category = 'ma'
        else:
            category = 'other'

        # S3 key
        rel_path = '/'.join(filepath.split('/')[5:])  # Remove /home/ubuntu/data/cms/
        s3_key = f"cms-data/{rel_path}"

        result = load_dataset(conn, category, s3_key, filepath)
        if result:
            success += 1
        else:
            failed += 1

        time.sleep(0.5)  # Rate limiting

    conn.close()

    print("\n" + "="*80)
    print(f"Summary: {success} success, {failed} failed")
    print("="*80)
    print("\nTables created in: DEV_DB.RAW schema")
    print("Table naming: CMS_<CATEGORY>_<FILENAME>")

if __name__ == '__main__':
    main()
