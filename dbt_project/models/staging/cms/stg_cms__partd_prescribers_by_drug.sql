with source as (
    select * from {{ source('cms', 'RAW_PARTD_PRESCRIBERS_BY_DRUG') }}
),

renamed as (
    select
        -- Prescriber identifiers
        "Prscrbr_NPI" as prescriber_npi,
        "Prscrbr_Last_Org_Name" as prescriber_last_name,
        "Prscrbr_First_Name" as prescriber_first_name,
        "Prscrbr_City" as prescriber_city,
        "Prscrbr_State_Abrvtn" as prescriber_state,
        "Prscrbr_State_FIPS" as prescriber_state_fips,
        "Prscrbr_Type" as prescriber_specialty,
        "Prscrbr_Type_Src" as prescriber_specialty_source,

        -- Drug identifiers
        "Brnd_Name" as brand_name,
        "Gnrc_Name" as generic_name,

        -- All beneficiaries metrics
        "Tot_Clms" as total_claims,
        "Tot_30day_Fills" as total_30day_fills,
        "Tot_Day_Suply" as total_day_supply,
        "Tot_Drug_Cst" as total_drug_cost,
        "Tot_Benes" as total_beneficiaries,

        -- 65+ beneficiaries metrics
        "GE65_Sprsn_Flag" as ge65_suppression_flag,
        "GE65_Tot_Clms" as ge65_total_claims,
        "GE65_Tot_30day_Fills" as ge65_total_30day_fills,
        "GE65_Tot_Drug_Cst" as ge65_total_drug_cost,
        "GE65_Tot_Day_Suply" as ge65_total_day_supply,
        "GE65_Bene_Sprsn_Flag" as ge65_beneficiary_suppression_flag,
        "GE65_Tot_Benes" as ge65_total_beneficiaries,

        -- Data quality
        current_timestamp() as loaded_at

    from source

    where "Brnd_Name" is not null
      and "Gnrc_Name" is not null
      and "Tot_Drug_Cst" is not null
      and "Tot_Drug_Cst" > 0
)

select * from renamed
