#!/usr/bin/env python3
"""
Export AIP data from Snowflake to static JSON files for fast deployment
"""
import snowflake.connector
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import serialization
import json
import os

# Snowflake connection
ACCOUNT = "jic51019.us-east-1"
USERNAME = "APP_SERVICE"
WAREHOUSE = "DEV_WH"
DATABASE = "DEV_DB"
ENV_FILE = "/home/ubuntu/projects/healthcare-analytics/app/.env.vercel.production"

# Output directory
OUTPUT_DIR = "/home/ubuntu/projects/healthcare-analytics/app/data/aip"

def load_private_key():
    """Load Snowflake private key"""
    with open(ENV_FILE, 'r') as f:
        for line in f:
            if line.startswith('SNOWFLAKE_PRIVATE_KEY='):
                key_str = line.split('="', 1)[1].rsplit('"', 1)[0]
                private_key_str = key_str.replace('\\n', '\n').encode()
                break

    private_key_obj = serialization.load_pem_private_key(
        private_key_str, password=None, backend=default_backend()
    )

    return private_key_obj.private_bytes(
        encoding=serialization.Encoding.DER,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    )

def export_data():
    """Export all AIP data to JSON files"""
    print("=" * 80)
    print("EXPORTING AIP DATA TO JSON")
    print("=" * 80)

    # Create output directory
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # Connect to Snowflake
    private_key = load_private_key()
    conn = snowflake.connector.connect(
        account=ACCOUNT,
        user=USERNAME,
        private_key=private_key,
        warehouse=WAREHOUSE,
        database=DATABASE,
        role='ACCOUNTADMIN'
    )
    cursor = conn.cursor()

    # 1. Export category summary
    print("\n1. Exporting category summary...")
    cursor.execute("""
        SELECT
            PERFORMANCE_YEAR,
            SPENDING_CATEGORY,
            NUM_ACOS,
            NUM_SUBCATEGORIES,
            TOTAL_ACTUAL_SPENDING,
            TOTAL_PROJECTED_SPENDING,
            AVG_ACTUAL_PER_RECORD,
            AVG_PROJECTED_PER_RECORD,
            TOTAL_ACOS_IN_YEAR,
            YEAR_TOTAL_ACTUAL,
            YEAR_TOTAL_PROJECTED,
            PCT_OF_YEAR_ACTUAL,
            PCT_OF_YEAR_PROJECTED
        FROM MARTS.V_AIP_CATEGORY_SUMMARY
        ORDER BY PERFORMANCE_YEAR DESC, TOTAL_ACTUAL_SPENDING DESC
    """)

    category_data = []
    for row in cursor.fetchall():
        category_data.append({
            'PERFORMANCE_YEAR': row[0],
            'SPENDING_CATEGORY': row[1],
            'NUM_ACOS': row[2],
            'NUM_SUBCATEGORIES': row[3],
            'TOTAL_ACTUAL_SPENDING': float(row[4]) if row[4] else None,
            'TOTAL_PROJECTED_SPENDING': float(row[5]) if row[5] else None,
            'AVG_ACTUAL_PER_RECORD': float(row[6]) if row[6] else None,
            'AVG_PROJECTED_PER_RECORD': float(row[7]) if row[7] else None,
            'TOTAL_ACOS_IN_YEAR': row[8],
            'YEAR_TOTAL_ACTUAL': float(row[9]) if row[9] else None,
            'YEAR_TOTAL_PROJECTED': float(row[10]) if row[10] else None,
            'PCT_OF_YEAR_ACTUAL': float(row[11]) if row[11] else None,
            'PCT_OF_YEAR_PROJECTED': float(row[12]) if row[12] else None,
        })

    with open(f"{OUTPUT_DIR}/category_summary.json", 'w') as f:
        json.dump(category_data, f, indent=2)
    print(f"   ✓ Exported {len(category_data)} category records")

    # 2. Export subcategory detail
    print("\n2. Exporting subcategory detail...")
    cursor.execute("""
        SELECT
            PERFORMANCE_YEAR,
            SPENDING_CATEGORY,
            SPENDING_SUBCATEGORY,
            NUM_ACOS,
            TOTAL_ACTUAL_SPENDING,
            TOTAL_PROJECTED_SPENDING,
            AVG_ACTUAL_PER_ACO,
            AVG_PROJECTED_PER_ACO,
            MIN_ACTUAL_SPENDING,
            MAX_ACTUAL_SPENDING,
            AVG_SAVINGS_RATE,
            ACOS_WITH_EARNINGS,
            ACOS_WITH_LOSSES
        FROM MARTS.V_AIP_SUBCATEGORY_DETAIL
        ORDER BY PERFORMANCE_YEAR DESC, TOTAL_ACTUAL_SPENDING DESC
    """)

    subcategory_data = []
    for row in cursor.fetchall():
        subcategory_data.append({
            'PERFORMANCE_YEAR': row[0],
            'SPENDING_CATEGORY': row[1],
            'SPENDING_SUBCATEGORY': row[2],
            'NUM_ACOS': row[3],
            'TOTAL_ACTUAL_SPENDING': float(row[4]) if row[4] else None,
            'TOTAL_PROJECTED_SPENDING': float(row[5]) if row[5] else None,
            'AVG_ACTUAL_PER_ACO': float(row[6]) if row[6] else None,
            'AVG_PROJECTED_PER_ACO': float(row[7]) if row[7] else None,
            'MIN_ACTUAL_SPENDING': float(row[8]) if row[8] else None,
            'MAX_ACTUAL_SPENDING': float(row[9]) if row[9] else None,
            'AVG_SAVINGS_RATE': float(row[10]) if row[10] else None,
            'ACOS_WITH_EARNINGS': row[11],
            'ACOS_WITH_LOSSES': row[12],
        })

    with open(f"{OUTPUT_DIR}/subcategory_detail.json", 'w') as f:
        json.dump(subcategory_data, f, indent=2)
    print(f"   ✓ Exported {len(subcategory_data)} subcategory records")

    # 3. Export ACO spending detail
    print("\n3. Exporting ACO spending detail...")
    cursor.execute("""
        SELECT
            PERFORMANCE_YEAR,
            ACO_ID,
            ACO_NAME,
            ACO_TRACK,
            ASSIGNED_BENEFICIARIES,
            SPENDING_CATEGORY,
            SPENDING_SUBCATEGORY,
            TOTAL_ACTUAL_SPENDING,
            TOTAL_PROJECTED_SPENDING,
            ACO_TOTAL_ACTUAL_SPENDING,
            ACO_TOTAL_PROJECTED_SPENDING,
            PCT_OF_TOTAL_ACTUAL,
            PCT_OF_TOTAL_PROJECTED,
            GENERATED_SAVINGS_LOSS,
            EARNED_SAVINGS_LOSS,
            SAVINGS_RATE_PERCENT,
            FINANCIAL_OUTCOME
        FROM MARTS.V_AIP_ACO_SPENDING_PCT
        ORDER BY PERFORMANCE_YEAR DESC, ACO_ID, TOTAL_ACTUAL_SPENDING DESC
    """)

    aco_spending_data = []
    for row in cursor.fetchall():
        aco_spending_data.append({
            'PERFORMANCE_YEAR': row[0],
            'ACO_ID': row[1],
            'ACO_NAME': row[2],
            'ACO_TRACK': row[3],
            'ASSIGNED_BENEFICIARIES': row[4],
            'SPENDING_CATEGORY': row[5],
            'SPENDING_SUBCATEGORY': row[6],
            'TOTAL_ACTUAL_SPENDING': float(row[7]) if row[7] else None,
            'TOTAL_PROJECTED_SPENDING': float(row[8]) if row[8] else None,
            'ACO_TOTAL_ACTUAL_SPENDING': float(row[9]) if row[9] else None,
            'ACO_TOTAL_PROJECTED_SPENDING': float(row[10]) if row[10] else None,
            'PCT_OF_TOTAL_ACTUAL': float(row[11]) if row[11] else None,
            'PCT_OF_TOTAL_PROJECTED': float(row[12]) if row[12] else None,
            'GENERATED_SAVINGS_LOSS': float(row[13]) if row[13] else None,
            'EARNED_SAVINGS_LOSS': float(row[14]) if row[14] else None,
            'SAVINGS_RATE_PERCENT': float(row[15]) if row[15] else None,
            'FINANCIAL_OUTCOME': row[16],
        })

    with open(f"{OUTPUT_DIR}/aco_spending.json", 'w') as f:
        json.dump(aco_spending_data, f, indent=2)
    print(f"   ✓ Exported {len(aco_spending_data)} ACO spending records")

    # 4. Create metadata file
    print("\n4. Creating metadata...")
    metadata = {
        'generated_at': cursor.execute("SELECT CURRENT_TIMESTAMP()").fetchone()[0].isoformat(),
        'category_records': len(category_data),
        'subcategory_records': len(subcategory_data),
        'aco_spending_records': len(aco_spending_data),
        'years': sorted(list(set(r['PERFORMANCE_YEAR'] for r in category_data)), reverse=True),
    }

    with open(f"{OUTPUT_DIR}/metadata.json", 'w') as f:
        json.dump(metadata, f, indent=2)

    print(f"   ✓ Created metadata")

    conn.close()

    print("\n" + "=" * 80)
    print("✅ AIP DATA EXPORT COMPLETE!")
    print("=" * 80)
    print(f"\nFiles created in {OUTPUT_DIR}:")
    print(f"  - category_summary.json ({len(category_data)} records)")
    print(f"  - subcategory_detail.json ({len(subcategory_data)} records)")
    print(f"  - aco_spending.json ({len(aco_spending_data)} records)")
    print(f"  - metadata.json")
    print(f"\nData covers years: {metadata['years']}")

if __name__ == '__main__':
    export_data()
