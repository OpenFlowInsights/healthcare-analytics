#!/usr/bin/env python3
"""Upload key CMS datasets to Supabase with automatic table creation"""
import os
import pandas as pd
from supabase import create_client
import time

# Supabase connection
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY')
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Priority datasets to upload (most useful for analytics)
PRIORITY_DATASETS = {
    'cms_aco_organizations': '/home/ubuntu/data/cms/aco/PY2026_Medicare_Shared_Savings_Program_Organizations_no extra space.csv',
    'cms_aco_participants_2026': '/home/ubuntu/data/cms/aco/PY2026_Medicare_Shared_Savings_Program_Participants.csv',
    'cms_aco_participants_2025': '/home/ubuntu/data/cms/aco/py2025_medicare_shared_savings_program_participants.csv',
    'cms_aco_reach_financial_2023': '/home/ubuntu/data/cms/aco/py3_fncl_qltypuf_rdx.csv',
    'cms_aco_reach_providers_2023': '/home/ubuntu/data/cms/aco/py3_prvdr_puf.csv',
    'cms_quality_snf_2023': '/home/ubuntu/data/cms/quality/CostReportsnf_Final_23.csv',
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

def create_table_sql(table_name, df):
    """Generate CREATE TABLE SQL"""
    columns = []
    for col in df.columns:
        clean_col = clean_column_name(col)
        col_type = infer_column_type(df[col])
        columns.append(f'  "{clean_col}" {col_type}')

    sql = f"""
-- Drop table if exists
DROP TABLE IF EXISTS public.{table_name};

-- Create table
CREATE TABLE public.{table_name} (
  id bigserial PRIMARY KEY,
{',\n'.join(columns)},
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.{table_name} ENABLE ROW LEVEL SECURITY;

-- Create policy (allow all for service role)
CREATE POLICY "Enable all access for service role"
  ON public.{table_name}
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
"""
    return sql

def upload_dataset(table_name, csv_path, max_rows=50000):
    """Upload a dataset to Supabase"""
    print(f"\n{'='*80}")
    print(f"Dataset: {table_name}")
    print(f"File: {os.path.basename(csv_path)}")

    try:
        # Read CSV
        if not os.path.exists(csv_path):
            print(f"  ✗ File not found: {csv_path}")
            return False

        df = pd.read_csv(csv_path, low_memory=False)
        original_rows = len(df)

        # Limit rows
        if len(df) > max_rows:
            print(f"  ⚠ Limiting to {max_rows:,} rows (total: {original_rows:,})")
            df = df.head(max_rows)

        print(f"  Rows: {len(df):,} | Columns: {len(df.columns)}")

        # Clean column names
        df.columns = [clean_column_name(col) for col in df.columns]

        # Generate CREATE TABLE SQL
        create_sql = create_table_sql(table_name, df)
        sql_file = f"/home/ubuntu/data/cms/sql/{table_name}_create.sql"
        os.makedirs(os.path.dirname(sql_file), exist_ok=True)
        with open(sql_file, 'w') as f:
            f.write(create_sql)
        print(f"  ✓ SQL saved: {sql_file}")

        # Execute CREATE TABLE via Supabase SQL API
        print(f"  → Creating table...")
        try:
            # Use postgrest RPC or direct SQL execution
            result = supabase.rpc('exec_sql', {'sql': create_sql}).execute()
            print(f"  ✓ Table created")
        except Exception as e:
            if 'does not exist' in str(e) or 'exec_sql' in str(e):
                print(f"  ⚠ Cannot execute SQL directly. Run SQL file manually in Supabase SQL Editor:")
                print(f"     {sql_file}")
                print(f"  → Attempting insert anyway...")
            else:
                print(f"  ⚠ Create table error: {e}")

        # Upload data in batches
        print(f"  → Uploading data...")
        batch_size = 1000
        total_uploaded = 0
        records = df.fillna('').to_dict('records')  # Fill NA to avoid null issues

        for i in range(0, len(records), batch_size):
            batch = records[i:i+batch_size]
            try:
                supabase.table(table_name).insert(batch).execute()
                total_uploaded += len(batch)
                print(f"    {total_uploaded:,}/{len(records):,} rows", end='\r')
            except Exception as e:
                print(f"\n  ✗ Upload error: {e}")
                print(f"  → Please run the SQL file first: {sql_file}")
                return False

        print(f"\n  ✓ Uploaded {total_uploaded:,} rows")
        return True

    except Exception as e:
        print(f"  ✗ Error: {e}")
        return False

def main():
    print("="*80)
    print("CMS KEY DATASETS → SUPABASE UPLOAD")
    print("="*80)
    print(f"\nDatasets to upload: {len(PRIORITY_DATASETS)}")

    success = 0
    failed = 0

    for table_name, csv_path in PRIORITY_DATASETS.items():
        result = upload_dataset(table_name, csv_path)
        if result:
            success += 1
        else:
            failed += 1
        time.sleep(1)  # Rate limiting

    print("\n" + "="*80)
    print(f"Summary: {success} success, {failed} failed")
    print("="*80)
    print("\nSQL files saved to: ~/data/cms/sql/")
    print("If uploads failed, run the SQL files in Supabase SQL Editor first")

if __name__ == '__main__':
    main()
