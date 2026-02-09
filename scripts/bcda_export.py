#!/usr/bin/env python3
"""
Export data from BCDA (Beneficiary Claims Data API) and upload to S3.
"""

import os
import logging
import time
import requests
from datetime import datetime
from typing import List, Dict
import boto3
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class BCDAExporter:
    """Handle BCDA API authentication and data export."""

    def __init__(self):
        self.base_url = "https://sandbox.bcda.cms.gov"
        self.client_id = os.getenv('BCDA_CLIENT_ID')
        self.client_secret = os.getenv('BCDA_CLIENT_SECRET')
        self.bucket = os.getenv('AWS_S3_BUCKET', 'ofi-healthcare-data')
        self.access_token = None
        self.session = self._create_session()

        if not self.client_id or not self.client_secret:
            raise ValueError("BCDA_CLIENT_ID and BCDA_CLIENT_SECRET must be set")

    def _create_session(self) -> requests.Session:
        """Create requests session with retry logic."""
        session = requests.Session()

        retry_strategy = Retry(
            total=5,
            backoff_factor=2,
            status_forcelist=[429, 500, 502, 503, 504],
            allowed_methods=["GET", "POST"]
        )

        adapter = HTTPAdapter(max_retries=retry_strategy)
        session.mount("http://", adapter)
        session.mount("https://", adapter)

        return session

    def authenticate(self):
        """Authenticate with BCDA and get access token."""
        logger.info("Authenticating with BCDA API")

        auth_url = f"{self.base_url}/auth/token"

        data = {
            'grant_type': 'client_credentials',
            'scope': 'system/*.*'
        }

        try:
            response = self.session.post(
                auth_url,
                auth=(self.client_id, self.client_secret),
                data=data,
                timeout=30
            )
            response.raise_for_status()

            token_data = response.json()
            self.access_token = token_data['access_token']
            logger.info("Successfully authenticated with BCDA")

        except Exception as e:
            logger.error(f"Authentication failed: {str(e)}")
            raise

    def start_export(self, resource_types: List[str]) -> str:
        """Start bulk data export job."""
        logger.info(f"Starting export for resource types: {', '.join(resource_types)}")

        export_url = f"{self.base_url}/api/v2/Patient/$export"

        headers = {
            'Authorization': f'Bearer {self.access_token}',
            'Accept': 'application/fhir+json',
            'Prefer': 'respond-async'
        }

        params = {
            '_type': ','.join(resource_types)
        }

        try:
            response = self.session.get(
                export_url,
                headers=headers,
                params=params,
                timeout=30
            )

            if response.status_code == 202:
                status_url = response.headers.get('Content-Location')
                logger.info(f"Export job started. Status URL: {status_url}")
                return status_url
            else:
                response.raise_for_status()

        except Exception as e:
            logger.error(f"Failed to start export: {str(e)}")
            raise

    def poll_export_status(self, status_url: str, max_wait: int = 600) -> Dict:
        """Poll export job status until complete."""
        logger.info("Polling export job status")

        headers = {
            'Authorization': f'Bearer {self.access_token}'
        }

        start_time = time.time()
        poll_interval = 10  # seconds

        while time.time() - start_time < max_wait:
            try:
                response = self.session.get(status_url, headers=headers, timeout=30)

                if response.status_code == 202:
                    logger.info("Export still in progress...")
                    time.sleep(poll_interval)
                    continue

                elif response.status_code == 200:
                    result = response.json()
                    logger.info("Export job completed successfully")
                    return result

                else:
                    response.raise_for_status()

            except Exception as e:
                logger.error(f"Error polling status: {str(e)}")
                time.sleep(poll_interval)
                continue

        raise TimeoutError(f"Export job did not complete within {max_wait} seconds")

    def download_file(self, url: str) -> bytes:
        """Download file from BCDA."""
        logger.info(f"Downloading file from {url}")

        headers = {
            'Authorization': f'Bearer {self.access_token}'
        }

        try:
            response = self.session.get(url, headers=headers, timeout=300)
            response.raise_for_status()

            logger.info(f"Downloaded {len(response.content)} bytes")
            return response.content

        except Exception as e:
            logger.error(f"Failed to download file: {str(e)}")
            raise

    def upload_to_s3(self, content: bytes, s3_key: str):
        """Upload file to S3."""
        logger.info(f"Uploading to s3://{self.bucket}/{s3_key}")

        s3_client = boto3.client('s3')

        try:
            s3_client.put_object(
                Bucket=self.bucket,
                Key=s3_key,
                Body=content,
                ContentType='application/fhir+ndjson'
            )

            logger.info(f"Successfully uploaded {len(content)} bytes to S3")

        except Exception as e:
            logger.error(f"Failed to upload to S3: {str(e)}")
            raise

    def process_export_results(self, export_result: Dict):
        """Process export results and upload to S3."""
        logger.info("Processing export results")

        # Map resource types to S3 prefixes
        resource_map = {
            'Patient': 'bcda/patients',
            'ExplanationOfBenefit': 'bcda/eob',
            'Coverage': 'bcda/coverage'
        }

        output_files = export_result.get('output', [])
        logger.info(f"Found {len(output_files)} files to process")

        uploaded_files = []
        date_stamp = datetime.now().strftime('%Y%m%d_%H%M%S')

        for idx, file_info in enumerate(output_files):
            try:
                resource_type = file_info.get('type')
                file_url = file_info.get('url')

                if not resource_type or not file_url:
                    logger.warning(f"Skipping file with missing type or URL: {file_info}")
                    continue

                logger.info(f"Processing {resource_type} file ({idx + 1}/{len(output_files)})")

                # Download file
                content = self.download_file(file_url)

                # Determine S3 path
                s3_prefix = resource_map.get(resource_type, f'bcda/{resource_type.lower()}')
                filename = f"{resource_type.lower()}_{date_stamp}_{idx}.ndjson"
                s3_key = f"{s3_prefix}/{filename}"

                # Upload to S3
                self.upload_to_s3(content, s3_key)
                uploaded_files.append(s3_key)

            except Exception as e:
                logger.error(f"Error processing file {idx + 1}: {str(e)}")
                continue

        return uploaded_files

    def run(self):
        """Execute the complete export workflow."""
        try:
            logger.info("=" * 60)
            logger.info("Starting BCDA Export Process")
            logger.info("=" * 60)

            # Authenticate
            self.authenticate()

            # Define resource types to export
            resource_types = ['Patient', 'ExplanationOfBenefit', 'Coverage']

            # Start export
            status_url = self.start_export(resource_types)

            # Poll until complete
            export_result = self.poll_export_status(status_url)

            # Download and upload files
            uploaded_files = self.process_export_results(export_result)

            # Summary
            logger.info("=" * 60)
            logger.info("Export Summary")
            logger.info("=" * 60)
            logger.info(f"Total files uploaded: {len(uploaded_files)}")
            logger.info("Uploaded files:")
            for file in uploaded_files:
                logger.info(f"  - s3://{self.bucket}/{file}")
            logger.info("=" * 60)
            logger.info("BCDA export completed successfully")

        except Exception as e:
            logger.error(f"Export process failed: {str(e)}")
            raise


def main():
    """Main entry point."""
    exporter = BCDAExporter()
    exporter.run()


if __name__ == "__main__":
    main()
