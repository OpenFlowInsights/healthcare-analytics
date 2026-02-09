{{
    config(
        materialized='view',
        tags=['cms', 'mssp', 'staging']
    )
}}

with source as (
    select * from {{ source('cms', 'RAW_MSSP_ACO_PUF') }}
),

renamed as (
    select
        -- IDs and identifiers
        "id" as record_id,
        "aco_id",
        "aco_num",

        -- ACO attributes
        "aco_name",
        "aco_state",
        "current_track" as aco_track,
        "agree_type" as agreement_type,
        "start_date",

        -- Performance metrics
        cast("performance_year" as integer) as performance_year,
        cast(replace("n_ab", ',', '') as integer) as total_beneficiaries,

        -- Financial metrics (convert from string/varchar to decimal, strip commas and dollar signs)
        cast(replace(replace("abtotbnchmk", ',', ''), '$', '') as decimal(18,2)) as benchmark_expenditure,
        cast(replace(replace("abtotexp", ',', ''), '$', '') as decimal(18,2)) as total_expenditure,
        cast(replace(replace("gensaveloss", ',', ''), '$', '') as decimal(18,2)) as savings_losses,
        cast(replace(replace("earnsaveloss", ',', ''), '$', '') as decimal(18,2)) as earned_shared_savings_losses,
        cast(replace(replace("earnshrsavings", ',', ''), '$', '') as decimal(18,2)) as earned_shared_savings_payment,

        -- Quality metrics (strip % sign and handle non-numeric values like P4R)
        try_cast(replace("qualscore", '%', '') as decimal(5,2)) as quality_score,

        -- Risk scores (convert to varchar first, then try_cast to handle special codes)
        try_cast(to_varchar("cms_hcc_riskscore_agnd_py") as decimal(4,3)) as risk_score_aged_non_dual,
        try_cast(to_varchar("cms_hcc_riskscore_agdu_py") as decimal(4,3)) as risk_score_aged_dual,
        try_cast(to_varchar("cms_hcc_riskscore_dis_py") as decimal(4,3)) as risk_score_disabled,

        -- Utilization metrics (cast numeric types directly)
        cast("readm_rate_1000" as decimal(5,2)) as readmission_rate_per_1000,
        cast("snf_los" as decimal(5,2)) as snf_length_of_stay,

        -- Calculate savings rate (strip formatting before calculating)
        case
            when cast(replace(replace("abtotbnchmk", ',', ''), '$', '') as decimal(18,2)) > 0
            then (cast(replace(replace("gensaveloss", ',', ''), '$', '') as decimal(18,2)) /
                  cast(replace(replace("abtotbnchmk", ',', ''), '$', '') as decimal(18,2))) * 100
            else null
        end as savings_rate_pct,

        -- Calculate per beneficiary costs (strip formatting before calculating)
        case
            when cast(replace("n_ab", ',', '') as integer) > 0
            then cast(replace(replace("abtotexp", ',', ''), '$', '') as decimal(18,2)) /
                 cast(replace("n_ab", ',', '') as integer)
            else null
        end as cost_per_beneficiary,

        -- Flags
        cast("met_qps" as integer) as met_quality_performance_standard,
        cast("reducedss" as integer) as reduced_shared_savings_flag,

        -- Metadata
        current_timestamp() as dbt_loaded_at

    from source
)

select * from renamed
