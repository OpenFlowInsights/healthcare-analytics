#!/usr/bin/env python3
"""Generate SQL script to load all CMS data from S3"""
import json
from pathlib import Path

with open('/home/ubuntu/data/cms/data_download_results.json') as f:
    results = json.load(f)

def clean_table_name(filename, category):
    name = Path(filename).stem
    name = ''.join(c if c.isalnum() or c == '_' else '_' for c in name)
    while '__' in name:
        name = name.replace('__', '_')
    name = name.strip('_')
    return f"CMS_{category.upper()}_{name}".upper()[:128]

sql_lines = [
    "-- Load ALL CMS P1 Data (153 datasets)",
    "-- Generated automatically from download results",
    "",
    "USE DATABASE DEV_DB;",
    "USE SCHEMA RAW;",
    "USE WAREHOUSE DEV_WH;",
    "",
]

count = 0
for item in results:
    if item['status'] != 'complete':
        continue

    filepath = item['filepath']
    filename = Path(filepath).name

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

    table_name = clean_table_name(filename, category)
    s3_path = f"cms-data/{category}/{filename}"

    sql = f"COPY INTO DEV_DB.RAW.{table_name} FROM @DEV_DB.RAW.S3_BCDA_STAGE/{s3_path} FILE_FORMAT = (FORMAT_NAME = 'DEV_DB.RAW.CSV_FORMAT') ON_ERROR = CONTINUE;"
    sql_lines.append(sql)
    count += 1

sql_lines.append(f"\n-- Total: {count} COPY statements generated")

with open('/home/ubuntu/projects/healthcare-analytics/load_cms_p1_full.sql', 'w') as f:
    f.write('\n'.join(sql_lines))

print(f"✓ Generated SQL script with {count} COPY commands")
print(f"  File: ~/projects/healthcare-analytics/load_cms_p1_full.sql")
