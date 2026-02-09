#!/usr/bin/env python3
"""Upload CMS datasets to Supabase"""
import os
import json
import pandas as pd
from supabase import create_client, Client
from pathlib import Path
import time

# Supabase connection
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY')
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def clean_table_name(filename: str) -> str:
    """Convert filename to valid Postgres table name"""
    name = Path(filename).stem.lower()
    # Replace special chars with underscore
    name = ''.join(c if c.isalnum() or c == '_' else '_' for c in name)
    # Remove consecutive underscores
    while '__' in name:
        name = name.replace('__', '_')
    # Ensure starts with letter
    if name[0].isdigit():
        name = 'cms_' + name
    # Limit length
    return name[:63]

def get_postgres_type(dtype):
    """Map pandas dtype to Postgres type"""
    if pd.api.types.is_integer_dtype(dtype):
        return 'bigint'
    elif pd.api.types.is_float_dtype(dtype):
        return 'numeric'
    elif pd.api.types.is_bool_dtype(dtype):
        return 'boolean'
    elif pd.api.types.is_datetime64_any_dtype(dtype):
        return 'timestamp'
    else:
        return 'text'

def upload_csv_to_supabase(csv_path: str, category: str, max_rows: int = None):
    """Upload a CSV file to Supabase"""
    table_name = f"cms_{category}_{clean_table_name(os.path.basename(csv_path))}"

    print(f"\n{'='*80}")
    print(f"Processing: {os.path.basename(csv_path)}")
    print(f"Table: {table_name}")

    try:
        # Read CSV
        df = pd.read_csv(csv_path, low_memory=False)

        if max_rows:
            df = df.head(max_rows)

        print(f"Rows: {len(df):,} | Columns: {len(df.columns)}")

        # Clean column names
        df.columns = [clean_table_name(col) for col in df.columns]

        # Convert to records
        records = df.to_dict('records')

        # Upload in batches
        batch_size = 1000
        total_uploaded = 0

        for i in range(0, len(records), batch_size):
            batch = records[i:i+batch_size]
            try:
                supabase.table(table_name).insert(batch).execute()
                total_uploaded += len(batch)
                print(f"  Uploaded {total_uploaded:,}/{len(records):,} rows", end='\r')
            except Exception as e:
                if 'does not exist' in str(e) or 'relation' in str(e):
                    print(f"\n  ⚠ Table doesn't exist. Create it manually in Supabase first.")
                    print(f"  Table: {table_name}")
                    print(f"  Columns: {', '.join(df.columns[:10])}...")
                    return False
                else:
                    print(f"\n  ✗ Error uploading batch: {e}")
                    return False

        print(f"\n  ✓ Uploaded {total_uploaded:,} rows to {table_name}")
        return True

    except Exception as e:
        print(f"  ✗ Error: {e}")
        return False

def main():
    # Load download results to get file list
    with open('/home/ubuntu/data/cms/data_download_results.json') as f:
        results = json.load(f)

    # Group by category
    by_category = {}
    for item in results:
        if item['status'] == 'complete':
            filepath = item['filepath']
            # Extract category from path
            parts = filepath.split('/')
            if 'aco' in parts:
                cat = 'aco'
            elif 'quality' in parts:
                cat = 'quality'
            elif 'claims' in parts:
                cat = 'claims'
            elif 'ma' in parts:
                cat = 'ma'
            else:
                cat = 'other'

            if cat not in by_category:
                by_category[cat] = []
            by_category[cat].append(filepath)

    print("="*80)
    print("CMS DATA → SUPABASE UPLOAD")
    print("="*80)
    print("\nFiles to upload:")
    for cat, files in by_category.items():
        print(f"  {cat.upper()}: {len(files)} files")

    # Upload priority files first (smaller datasets for testing)
    print("\n" + "="*80)
    print("Starting uploads...")
    print("="*80)

    success = 0
    failed = 0
    skipped = 0

    # Start with smaller ACO files
    aco_files = sorted(by_category.get('aco', []), key=lambda x: os.path.getsize(x))

    for filepath in aco_files[:10]:  # Upload first 10 ACO files as test
        if os.path.getsize(filepath) > 50 * 1024 * 1024:  # Skip files > 50MB
            print(f"\n⊘ Skipping (too large): {os.path.basename(filepath)}")
            skipped += 1
            continue

        result = upload_csv_to_supabase(filepath, 'aco', max_rows=10000)
        if result:
            success += 1
        else:
            failed += 1

        time.sleep(0.5)  # Rate limiting

    print("\n" + "="*80)
    print(f"Upload Summary: {success} success, {failed} failed, {skipped} skipped")
    print("="*80)
    print("\nNote: Supabase tables must be created first via SQL or Supabase UI")
    print("Use the Supabase Table Editor to create tables with matching column names")

if __name__ == '__main__':
    main()
