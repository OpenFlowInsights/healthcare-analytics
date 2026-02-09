#!/usr/bin/env python3
"""
Export Supabase tables to S3 with date-stamped filenames.
"""

import os
import logging
from datetime import datetime
from io import StringIO
import boto3
from supabase import create_client, Client
import pandas as pd

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def get_supabase_client() -> Client:
    """Initialize Supabase client from environment variables."""
    url = os.getenv('SUPABASE_URL')
    key = os.getenv('SUPABASE_SERVICE_KEY')

    if not url or not key:
        raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set")

    return create_client(url, key)


def export_table_to_csv(supabase: Client, schema: str, table: str) -> str:
    """Export a Supabase table to CSV string with pagination."""
    logger.info(f"Fetching data from {schema}.{table}")

    all_data = []
    batch_size = 1000
    offset = 0

    while True:
        # Fetch batch using range
        end = offset + batch_size - 1
        logger.info(f"Fetching rows {offset} to {end}")

        response = supabase.schema(schema).table(table).select("*").range(offset, end).execute()

        if not response.data:
            break

        batch_count = len(response.data)
        all_data.extend(response.data)
        logger.info(f"Fetched {batch_count} rows (total: {len(all_data)})")

        # If we got fewer rows than batch_size, we've reached the end
        if batch_count < batch_size:
            break

        offset += batch_size

    if not all_data:
        logger.warning(f"No data found in {schema}.{table}")
        return ""

    # Convert to DataFrame and then to CSV
    df = pd.DataFrame(all_data)
    csv_buffer = StringIO()
    df.to_csv(csv_buffer, index=False)

    logger.info(f"Exported {len(df)} rows from {schema}.{table}")
    return csv_buffer.getvalue()


def upload_to_s3(csv_content: str, table_name: str, bucket: str, prefix: str):
    """Upload CSV content to S3 with date-stamped filename."""
    s3_client = boto3.client('s3')

    # Create date-stamped filename
    date_stamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f"{table_name}_{date_stamp}.csv"
    s3_key = f"{prefix}/{filename}"

    logger.info(f"Uploading to s3://{bucket}/{s3_key}")

    # Upload to S3
    s3_client.put_object(
        Bucket=bucket,
        Key=s3_key,
        Body=csv_content.encode('utf-8'),
        ContentType='text/csv'
    )

    logger.info(f"Successfully uploaded {filename} ({len(csv_content)} bytes)")
    return s3_key


def main():
    """Main execution function."""
    try:
        # Configuration
        BUCKET = 'ofi-healthcare-data'
        PREFIX = 'supabase-exports'
        SCHEMA = 'public'
        TABLES = ['ma_enrollment', 'mssp_aco_puf']

        logger.info("Starting Supabase to S3 export process")

        # Initialize Supabase client
        supabase = get_supabase_client()

        exported_files = []

        # Export each table
        for table in TABLES:
            try:
                # Export to CSV
                csv_content = export_table_to_csv(supabase, SCHEMA, table)

                if csv_content:
                    # Upload to S3
                    s3_key = upload_to_s3(csv_content, table, BUCKET, PREFIX)
                    exported_files.append(s3_key)
                else:
                    logger.warning(f"Skipping upload for {table} (no data)")

            except Exception as e:
                logger.error(f"Error processing {table}: {str(e)}")
                continue

        # Summary
        logger.info("=" * 60)
        logger.info("Export Summary")
        logger.info("=" * 60)
        logger.info(f"Total tables processed: {len(TABLES)}")
        logger.info(f"Successfully exported: {len(exported_files)}")
        logger.info("Exported files:")
        for file in exported_files:
            logger.info(f"  - s3://{BUCKET}/{file}")
        logger.info("=" * 60)

    except Exception as e:
        logger.error(f"Fatal error: {str(e)}")
        raise


if __name__ == "__main__":
    main()
