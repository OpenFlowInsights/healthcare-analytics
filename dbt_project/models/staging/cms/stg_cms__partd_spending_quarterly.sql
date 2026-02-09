with source as (
    select * from {{ source('cms', 'RAW_PARTD_SPENDING_QUARTERLY') }}
),

renamed as (
    select
        -- Drug identifiers
        "Brnd_Name" as brand_name,
        "Gnrc_Name" as generic_name,
        "Drug_Uses" as drug_uses,

        -- Manufacturer
        "Mftr_Name" as manufacturer_name,
        "Tot_Mftr" as manufacturer_count,

        -- Time period - parse the Year column like "2024 (Q1-Q4)"
        split_part("Year", ' ', 1)::int as year,
        regexp_substr("Year", 'Q[0-9]')  as quarter,
        "Year" as year_raw,

        -- Metrics
        "Tot_Benes" as total_beneficiaries,
        "Tot_Clms" as total_claims,
        "Tot_Spndng" as total_spending,
        "Avg_Spnd_Per_Bene" as avg_spending_per_beneficiary,
        "Avg_Spnd_Per_Clm" as avg_spending_per_claim,

        -- Data quality
        current_timestamp() as loaded_at

    from source

    where "Brnd_Name" is not null
      and "Gnrc_Name" is not null
      and "Tot_Spndng" is not null
      and "Tot_Spndng" > 0
)

select * from renamed
