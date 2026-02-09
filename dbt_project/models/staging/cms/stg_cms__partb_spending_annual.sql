with source as (
    select * from {{ source('cms', 'RAW_PARTB_SPENDING_ANNUAL') }}
),

unpivoted as (
    -- Unpivot year columns (2019-2023) into rows
    select
        "HCPCS_Cd",
        "HCPCS_Desc",
        "Brnd_Name",
        "Gnrc_Name",
        2019 as year,
        "Tot_Spndng_2019" as total_spending,
        "Tot_Dsg_Unts_2019" as total_dosage_units,
        "Tot_Clms_2019" as total_claims,
        "Tot_Benes_2019" as total_beneficiaries,
        "Avg_Spndng_Per_Dsg_Unt_2019" as avg_spending_per_dosage_unit,
        "Avg_Spndng_Per_Clm_2019" as avg_spending_per_claim,
        "Avg_Spndng_Per_Bene_2019" as avg_spending_per_beneficiary,
        "Outlier_Flag_2019" as outlier_flag
    from source
    where "Tot_Spndng_2019" is not null

    union all

    select
        "HCPCS_Cd",
        "HCPCS_Desc",
        "Brnd_Name",
        "Gnrc_Name",
        2020 as year,
        "Tot_Spndng_2020",
        "Tot_Dsg_Unts_2020",
        "Tot_Clms_2020",
        "Tot_Benes_2020",
        "Avg_Spndng_Per_Dsg_Unt_2020",
        "Avg_Spndng_Per_Clm_2020",
        "Avg_Spndng_Per_Bene_2020",
        "Outlier_Flag_2020"
    from source
    where "Tot_Spndng_2020" is not null

    union all

    select
        "HCPCS_Cd",
        "HCPCS_Desc",
        "Brnd_Name",
        "Gnrc_Name",
        2021 as year,
        "Tot_Spndng_2021",
        "Tot_Dsg_Unts_2021",
        "Tot_Clms_2021",
        "Tot_Benes_2021",
        "Avg_Spndng_Per_Dsg_Unt_2021",
        "Avg_Spndng_Per_Clm_2021",
        "Avg_Spndng_Per_Bene_2021",
        "Outlier_Flag_2021"
    from source
    where "Tot_Spndng_2021" is not null

    union all

    select
        "HCPCS_Cd",
        "HCPCS_Desc",
        "Brnd_Name",
        "Gnrc_Name",
        2022 as year,
        "Tot_Spndng_2022",
        "Tot_Dsg_Unts_2022",
        "Tot_Clms_2022",
        "Tot_Benes_2022",
        "Avg_Spndng_Per_Dsg_Unt_2022",
        "Avg_Spndng_Per_Clm_2022",
        "Avg_Spndng_Per_Bene_2022",
        "Outlier_Flag_2022"
    from source
    where "Tot_Spndng_2022" is not null

    union all

    select
        "HCPCS_Cd",
        "HCPCS_Desc",
        "Brnd_Name",
        "Gnrc_Name",
        2023 as year,
        "Tot_Spndng_2023",
        "Tot_Dsg_Unts_2023",
        "Tot_Clms_2023",
        "Tot_Benes_2023",
        "Avg_Spndng_Per_Dsg_Unt_2023",
        "Avg_Spndng_Per_Clm_2023",
        "Avg_Spndng_Per_Bene_2023",
        "Outlier_Flag_2023"
    from source
    where "Tot_Spndng_2023" is not null
),

renamed as (
    select
        -- Drug identifiers
        "HCPCS_Cd" as hcpcs_code,
        "HCPCS_Desc" as hcpcs_description,
        "Brnd_Name" as brand_name,
        "Gnrc_Name" as generic_name,

        -- Time period
        year,

        -- Metrics
        total_spending,
        total_dosage_units,
        total_claims,
        total_beneficiaries,
        avg_spending_per_dosage_unit,
        avg_spending_per_claim,
        avg_spending_per_beneficiary,
        outlier_flag,

        -- Data quality
        current_timestamp() as loaded_at

    from unpivoted

    where brand_name is not null
      and generic_name is not null
      and total_spending > 0
)

select * from renamed
