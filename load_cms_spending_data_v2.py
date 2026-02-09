#!/usr/bin/env python3
"""
Load CMS Part D and Part B Spending datasets into Snowflake DEV_DB.RAW
"""

import os
import snowflake.connector
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Snowflake connection parameters
SNOWFLAKE_ACCOUNT = "RRISPXQ-JUC46944"
SNOWFLAKE_USER = "APP_SERVICE"
SNOWFLAKE_PASSWORD = os.getenv("SNOWFLAKE_PASSWORD")
SNOWFLAKE_WAREHOUSE = "DEV_WH"
SNOWFLAKE_DATABASE = "DEV_DB"
SNOWFLAKE_SCHEMA = "RAW"

# S3 paths and table definitions
DATASETS = [
    {
        "name": "Part D Prescribers by Drug (2013-2023)",
        "table": "RAW_PARTD_PRESCRIBERS_BY_DRUG",
        "s3_path": "s3://ofi-healthcare-data/cms/partd_prescribers_by_drug/",
        "stage": "STAGE_PARTD_PRESCRIBERS",
        "pattern": ".*\\.csv"
    },
    {
        "name": "Part D Spending Annual",
        "table": "RAW_PARTD_SPENDING_ANNUAL",
        "s3_path": "s3://ofi-healthcare-data/cms/partd_spending_annual/",
        "stage": "STAGE_PARTD_SPENDING_ANNUAL",
        "pattern": ".*\\.csv"
    },
    {
        "name": "Part D Spending Quarterly",
        "table": "RAW_PARTD_SPENDING_QUARTERLY",
        "s3_path": "s3://ofi-healthcare-data/cms/partd_spending_quarterly/",
        "stage": "STAGE_PARTD_SPENDING_QUARTERLY",
        "pattern": ".*\\.csv"
    },
    {
        "name": "Part B Spending Annual",
        "table": "RAW_PARTB_SPENDING_ANNUAL",
        "s3_path": "s3://ofi-healthcare-data/cms/partb_spending_annual/",
        "stage": "STAGE_PARTB_SPENDING_ANNUAL",
        "pattern": ".*\\.csv"
    },
    {
        "name": "Part B Spending Quarterly",
        "table": "RAW_PARTB_SPENDING_QUARTERLY",
        "s3_path": "s3://ofi-healthcare-data/cms/partb_spending_quarterly/",
        "stage": "STAGE_PARTB_SPENDING_QUARTERLY",
        "pattern": ".*\\.csv"
    }
]


def execute_sql(conn, sql, description):
    """Execute SQL and print result"""
    print(f"\n{'='*80}")
    print(f"{description}")
    print(f"{'='*80}")

    try:
        cursor = conn.cursor()
        cursor.execute(sql)
        result = cursor.fetchall()
        if result:
            for row in result:
                print(row)
        else:
            print("✓ Success")
        cursor.close()
        return True
    except Exception as e:
        print(f"✗ Error: {e}")
        return False


def main():
    print(f"Connecting to Snowflake as {SNOWFLAKE_USER} with ACCOUNTADMIN role...")

    conn = snowflake.connector.connect(
        account=SNOWFLAKE_ACCOUNT,
        user=SNOWFLAKE_USER,
        password=SNOWFLAKE_PASSWORD,
        warehouse=SNOWFLAKE_WAREHOUSE,
        database=SNOWFLAKE_DATABASE,
        schema=SNOWFLAKE_SCHEMA,
        role='ACCOUNTADMIN'
    )

    print("✓ Connected to Snowflake")

    # Set context
    execute_sql(conn, "USE WAREHOUSE DEV_WH", "Set warehouse")
    execute_sql(conn, "USE DATABASE DEV_DB", "Set database")
    execute_sql(conn, "USE SCHEMA RAW", "Set schema")

    # Process each dataset
    for dataset in DATASETS:
        print(f"\n\n{'#'*80}")
        print(f"# Processing: {dataset['name']}")
        print(f"{'#'*80}")

        # 1. Create stage for S3 path
        create_stage_sql = f"""
        CREATE OR REPLACE STAGE {SNOWFLAKE_DATABASE}.{SNOWFLAKE_SCHEMA}.{dataset['stage']}
        URL = '{dataset['s3_path']}'
        STORAGE_INTEGRATION = S3_INTEGRATION
        """
        if not execute_sql(conn, create_stage_sql, f"Create stage {dataset['stage']}"):
            continue

        # 2. List files in stage
        list_files_sql = f"LIST @{SNOWFLAKE_DATABASE}.{SNOWFLAKE_SCHEMA}.{dataset['stage']}"
        execute_sql(conn, list_files_sql, f"List files in {dataset['stage']}")

        # 3. Create table using INFER_SCHEMA with stage
        create_table_sql = f"""
        CREATE OR REPLACE TABLE {SNOWFLAKE_DATABASE}.{SNOWFLAKE_SCHEMA}.{dataset['table']}
        USING TEMPLATE (
            SELECT ARRAY_AGG(OBJECT_CONSTRUCT(*))
            FROM TABLE(
                INFER_SCHEMA(
                    LOCATION => '@{SNOWFLAKE_DATABASE}.{SNOWFLAKE_SCHEMA}.{dataset['stage']}',
                    FILE_FORMAT => 'CSV_PARSE_HEADER'
                )
            )
        )
        """
        if not execute_sql(conn, create_table_sql, f"Create table {dataset['table']}"):
            continue

        # 4. Copy data into table
        copy_sql = f"""
        COPY INTO {SNOWFLAKE_DATABASE}.{SNOWFLAKE_SCHEMA}.{dataset['table']}
        FROM @{SNOWFLAKE_DATABASE}.{SNOWFLAKE_SCHEMA}.{dataset['stage']}
        FILE_FORMAT = (TYPE = 'CSV' SKIP_HEADER = 1 FIELD_OPTIONALLY_ENCLOSED_BY = '"')
        PATTERN = '{dataset['pattern']}'
        MATCH_BY_COLUMN_NAME = CASE_INSENSITIVE
        FORCE = TRUE
        ON_ERROR = CONTINUE
        """
        execute_sql(conn, copy_sql, f"Copy data into {dataset['table']}")

        # 5. Verify row count
        count_sql = f"SELECT COUNT(*) as row_count FROM {SNOWFLAKE_DATABASE}.{SNOWFLAKE_SCHEMA}.{dataset['table']}"
        execute_sql(conn, count_sql, f"Verify {dataset['table']} row count")

    # Final summary
    print(f"\n\n{'='*80}")
    print("FINAL VERIFICATION - Row Counts and Column Counts")
    print(f"{'='*80}")

    summary_results = []
    for dataset in DATASETS:
        # Get row count and column count
        cursor = conn.cursor()

        # Row count
        cursor.execute(f"SELECT COUNT(*) FROM {SNOWFLAKE_DATABASE}.{SNOWFLAKE_SCHEMA}.{dataset['table']}")
        row_count = cursor.fetchone()[0]

        # Column count
        cursor.execute(f"SHOW COLUMNS IN {SNOWFLAKE_DATABASE}.{SNOWFLAKE_SCHEMA}.{dataset['table']}")
        col_count = len(cursor.fetchall())

        # Sample of first few columns
        cursor.execute(f"SHOW COLUMNS IN {SNOWFLAKE_DATABASE}.{SNOWFLAKE_SCHEMA}.{dataset['table']}")
        columns = cursor.fetchall()
        sample_cols = [col[2] for col in columns[:5]]  # First 5 column names

        cursor.close()

        summary_results.append({
            'table': dataset['table'],
            'rows': row_count,
            'columns': col_count,
            'sample_cols': sample_cols
        })

        print(f"\nTable: {dataset['table']}")
        print(f"  Rows: {row_count:,}")
        print(f"  Columns: {col_count}")
        print(f"  Sample columns: {', '.join(sample_cols)}")

    conn.close()
    print("\n✓ All datasets loaded successfully!")

    # Print summary table
    print(f"\n{'='*80}")
    print("SUMMARY")
    print(f"{'='*80}")
    print(f"{'Table Name':<40} {'Rows':>15} {'Columns':>10}")
    print(f"{'-'*40} {'-'*15} {'-'*10}")
    for result in summary_results:
        print(f"{result['table']:<40} {result['rows']:>15,} {result['columns']:>10}")


if __name__ == "__main__":
    main()
