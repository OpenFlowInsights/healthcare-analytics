#!/usr/bin/env python3
"""Upload CMS data directly to Supabase Postgres"""
import os
import pandas as pd
import psycopg2
from psycopg2.extras import execute_batch
import time

# Supabase Postgres connection
# Format: postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres
SUPABASE_DB_URL = "postgresql://postgres.srbwjofjvwqjugatrvee:jaldkDr72JDSDF1@aws-0-us-east-1.pooler.supabase.com:6543/postgres"

# Priority datasets
PRIORITY_DATASETS = {
    'cms_aco_participants_2026': '/home/ubuntu/data/cms/aco/PY2026_Medicare_Shared_Savings_Program_Participants.csv',
    'cms_aco_participants_2025': '/home/ubuntu/data/cms/aco/py2025_medicare_shared_savings_program_participants.csv',
    'cms_aco_reach_financial_2023': '/home/ubuntu/data/cms/aco/py3_fncl_qltypuf_rdx.csv',
}

def clean_column_name(col):
    """Clean column name for Postgres"""
    return ''.join(c.lower() if c.isalnum() else '_' for c in str(col))[:63]

def infer_column_type(series):
    """Infer SQL type from pandas series"""
    if pd.api.types.is_integer_dtype(series):
        return 'bigint'
    elif pd.api.types.is_float_dtype(series):
        return 'numeric'
    elif pd.api.types.is_bool_dtype(series):
        return 'boolean'
    elif pd.api.types.is_datetime64_any_dtype(series):
        return 'timestamptz'
    else:
        return 'text'

def upload_dataset(conn, table_name, csv_path, max_rows=50000):
    """Upload dataset to Postgres"""
    print(f"\n{'='*80}")
    print(f"Dataset: {table_name}")
    print(f"File: {os.path.basename(csv_path)}")

    try:
        # Read CSV
        if not os.path.exists(csv_path):
            print(f"  ✗ File not found")
            return False

        df = pd.read_csv(csv_path, low_memory=False)
        original_rows = len(df)

        if len(df) > max_rows:
            print(f"  ⚠ Limiting to {max_rows:,} rows (total: {original_rows:,})")
            df = df.head(max_rows)

        print(f"  Rows: {len(df):,} | Columns: {len(df.columns)}")

        # Clean column names
        df.columns = [clean_column_name(col) for col in df.columns]

        # Create table
        cursor = conn.cursor()

        # Drop if exists
        print(f"  → Dropping old table if exists...")
        cursor.execute(f"DROP TABLE IF EXISTS public.{table_name}")

        # Generate CREATE TABLE
        columns = []
        for col in df.columns:
            col_type = infer_column_type(df[col])
            columns.append(f'"{col}" {col_type}')

        create_sql = f"""
        CREATE TABLE public.{table_name} (
            id SERIAL PRIMARY KEY,
            {', '.join(columns)},
            created_at TIMESTAMPTZ DEFAULT NOW()
        )
        """

        print(f"  → Creating table...")
        cursor.execute(create_sql)
        conn.commit()
        print(f"  ✓ Table created")

        # Insert data
        print(f"  → Inserting data...")
        df_clean = df.fillna('')  # Replace NaN with empty string

        # Prepare insert statement
        cols = ', '.join([f'"{col}"' for col in df.columns])
        placeholders = ', '.join(['%s'] * len(df.columns))
        insert_sql = f"INSERT INTO public.{table_name} ({cols}) VALUES ({placeholders})"

        # Batch insert
        batch_size = 1000
        total_inserted = 0

        for i in range(0, len(df_clean), batch_size):
            batch = df_clean.iloc[i:i+batch_size]
            values = [tuple(row) for row in batch.values]
            execute_batch(cursor, insert_sql, values)
            conn.commit()
            total_inserted += len(batch)
            print(f"    {total_inserted:,}/{len(df):,} rows", end='\r')

        print(f"\n  ✓ Inserted {total_inserted:,} rows")

        cursor.close()
        return True

    except Exception as e:
        print(f"  ✗ Error: {e}")
        conn.rollback()
        return False

def main():
    print("="*80)
    print("CMS DATASETS → SUPABASE POSTGRES UPLOAD")
    print("="*80)

    try:
        print("\nConnecting to Supabase Postgres...")
        conn = psycopg2.connect(SUPABASE_DB_URL)
        print("✓ Connected")

        success = 0
        failed = 0

        for table_name, csv_path in PRIORITY_DATASETS.items():
            result = upload_dataset(conn, table_name, csv_path)
            if result:
                success += 1
            else:
                failed += 1
            time.sleep(1)

        conn.close()

        print("\n" + "="*80)
        print(f"Summary: {success} success, {failed} failed")
        print("="*80)

    except Exception as e:
        print(f"\n✗ Connection error: {e}")
        print("\nCheck Supabase connection string in script")

if __name__ == '__main__':
    main()
