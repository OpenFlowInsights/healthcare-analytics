#!/usr/bin/env python3
"""
Load CMS Part D and Part B Spending datasets into Snowflake DEV_DB.RAW
"""

import os
import snowflake.connector

# Snowflake connection parameters
SNOWFLAKE_ACCOUNT = "RRISPXQ-JUC46944"
SNOWFLAKE_USER = "APP_SERVICE"
SNOWFLAKE_PASSWORD = "jaldkDr72JDSDF1"
SNOWFLAKE_WAREHOUSE = "DEV_WH"
SNOWFLAKE_DATABASE = "DEV_DB"
SNOWFLAKE_SCHEMA = "RAW"

def main():
    print(f"Connecting to Snowflake...")

    conn = snowflake.connector.connect(
        account=SNOWFLAKE_ACCOUNT,
        user=SNOWFLAKE_USER,
        password=SNOWFLAKE_PASSWORD,
        warehouse=SNOWFLAKE_WAREHOUSE,
        database=SNOWFLAKE_DATABASE,
        schema=SNOWFLAKE_SCHEMA,
        role='ACCOUNTADMIN'
    )

    print("✓ Connected")
    cursor = conn.cursor()

    # Define datasets (skip Part D Prescribers for now due to encoding issues)
    simple_datasets = [
        {
            "name": "Part D Spending Annual",
            "table": "RAW_PARTD_SPENDING_ANNUAL",
            "stage": "STAGE_PARTD_SPENDING_ANNUAL"
        },
        {
            "name": "Part D Spending Quarterly",
            "table": "RAW_PARTD_SPENDING_QUARTERLY",
            "stage": "STAGE_PARTD_SPENDING_QUARTERLY"
        },
        {
            "name": "Part B Spending Annual",
            "table": "RAW_PARTB_SPENDING_ANNUAL",
            "stage": "STAGE_PARTB_SPENDING_ANNUAL"
        },
        {
            "name": "Part B Spending Quarterly",
            "table": "RAW_PARTB_SPENDING_QUARTERLY",
            "stage": "STAGE_PARTB_SPENDING_QUARTERLY"
        }
    ]

    # Process simple datasets
    for ds in simple_datasets:
        print(f"\n{'#'*80}")
        print(f"# {ds['name']}")
        print(f"{'#'*80}")

        # Create table using INFER_SCHEMA
        print(f"Creating table {ds['table']}...")
        cursor.execute(f"""
            CREATE OR REPLACE TABLE {ds['table']}
            USING TEMPLATE (
                SELECT ARRAY_AGG(OBJECT_CONSTRUCT(*))
                FROM TABLE(
                    INFER_SCHEMA(
                        LOCATION => '@{ds['stage']}',
                        FILE_FORMAT => 'CSV_PARSE_HEADER'
                    )
                )
            )
        """)
        print("✓ Table created")

        # Copy data
        print(f"Loading data into {ds['table']}...")
        cursor.execute(f"""
            COPY INTO {ds['table']}
            FROM @{ds['stage']}
            FILE_FORMAT = (
                TYPE = 'CSV'
                PARSE_HEADER = TRUE
                FIELD_OPTIONALLY_ENCLOSED_BY = '"'
                REPLACE_INVALID_CHARACTERS = TRUE
                ERROR_ON_COLUMN_COUNT_MISMATCH = FALSE
            )
            MATCH_BY_COLUMN_NAME = CASE_INSENSITIVE
            FORCE = TRUE
            ON_ERROR = CONTINUE
        """)
        print("✓ Data loaded")

        # Check row count
        cursor.execute(f"SELECT COUNT(*) FROM {ds['table']}")
        count = cursor.fetchone()[0]
        print(f"✓ Row count: {count:,}")

    # Handle Part D Prescribers separately (use one file to infer schema)
    print(f"\n{'#'*80}")
    print(f"# Part D Prescribers by Drug (2013-2023)")
    print(f"{'#'*80}")

    print("Creating table RAW_PARTD_PRESCRIBERS_BY_DRUG...")
    print("Using 2023 file as template (most recent)...")
    cursor.execute("""
        CREATE OR REPLACE TABLE RAW_PARTD_PRESCRIBERS_BY_DRUG
        USING TEMPLATE (
            SELECT ARRAY_AGG(OBJECT_CONSTRUCT(*))
            FROM TABLE(
                INFER_SCHEMA(
                    LOCATION => '@STAGE_PARTD_PRESCRIBERS/2023/',
                    FILE_FORMAT => 'CSV_PARSE_HEADER'
                )
            )
        )
    """)
    print("✓ Table created")

    print("Loading data from all years...")
    cursor.execute("""
        COPY INTO RAW_PARTD_PRESCRIBERS_BY_DRUG
        FROM @STAGE_PARTD_PRESCRIBERS
        FILE_FORMAT = (
            TYPE = 'CSV'
            PARSE_HEADER = TRUE
            FIELD_OPTIONALLY_ENCLOSED_BY = '"'
            ENCODING = 'UTF8'
            REPLACE_INVALID_CHARACTERS = TRUE
            ERROR_ON_COLUMN_COUNT_MISMATCH = FALSE
        )
        MATCH_BY_COLUMN_NAME = CASE_INSENSITIVE
        FORCE = TRUE
        ON_ERROR = CONTINUE
    """)
    print("✓ Data loaded")

    cursor.execute("SELECT COUNT(*) FROM RAW_PARTD_PRESCRIBERS_BY_DRUG")
    count = cursor.fetchone()[0]
    print(f"✓ Row count: {count:,}")

    # Final summary
    print(f"\n\n{'='*80}")
    print("FINAL SUMMARY")
    print(f"{'='*80}")
    print(f"{'Table Name':<40} {'Rows':>15} {'Columns':>10}")
    print(f"{'-'*40} {'-'*15} {'-'*10}")

    all_tables = [
        'RAW_PARTD_PRESCRIBERS_BY_DRUG',
        'RAW_PARTD_SPENDING_ANNUAL',
        'RAW_PARTD_SPENDING_QUARTERLY',
        'RAW_PARTB_SPENDING_ANNUAL',
        'RAW_PARTB_SPENDING_QUARTERLY'
    ]

    for table in all_tables:
        cursor.execute(f"SELECT COUNT(*) FROM {table}")
        row_count = cursor.fetchone()[0]

        cursor.execute(f"SHOW COLUMNS IN {table}")
        col_count = len(cursor.fetchall())

        print(f"{table:<40} {row_count:>15,} {col_count:>10}")

    # Show sample data
    print(f"\n{'='*80}")
    print("SAMPLE DATA")
    print(f"{'='*80}")

    for table in all_tables:
        print(f"\n{table}:")
        cursor.execute(f"SELECT * FROM {table} LIMIT 3")
        columns = [desc[0] for desc in cursor.description]
        print(f"  Columns: {', '.join(columns[:5])}...")
        rows = cursor.fetchall()
        print(f"  Sample: {len(rows)} rows fetched")

    cursor.close()
    conn.close()
    print("\n✓ All datasets loaded successfully!")


if __name__ == "__main__":
    main()
