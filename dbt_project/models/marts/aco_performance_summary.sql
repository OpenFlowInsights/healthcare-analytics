{{
    config(
        materialized='table',
        tags=['marts', 'cms', 'aco', 'performance']
    )
}}

with aco_staging as (
    select * from {{ ref('stg_cms__mssp_aco_puf') }}
),

aco_summary as (
    select
        -- ACO identifiers (lowercase from source)
        "aco_id" as aco_id,
        "aco_name" as aco_name,
        "aco_state" as aco_state,
        "aco_num" as aco_num,

        -- Time dimension (uppercase aliased)
        PERFORMANCE_YEAR as performance_year,

        -- ACO program details
        ACO_TRACK as aco_track,
        AGREEMENT_TYPE as agreement_type,
        "start_date" as start_date,

        -- Beneficiary metrics
        TOTAL_BENEFICIARIES as total_beneficiaries,

        -- Financial metrics
        BENCHMARK_EXPENDITURE as benchmark_expenditure,
        TOTAL_EXPENDITURE as total_expenditure,
        SAVINGS_LOSSES as savings_losses,
        EARNED_SHARED_SAVINGS_LOSSES as earned_shared_savings_losses,
        EARNED_SHARED_SAVINGS_PAYMENT as earned_shared_savings_payment,

        -- Calculated metrics
        SAVINGS_RATE_PCT as savings_rate_pct,
        COST_PER_BENEFICIARY as cost_per_beneficiary,

        -- Quality metrics
        QUALITY_SCORE as quality_score,

        -- Risk scores
        RISK_SCORE_AGED_NON_DUAL as risk_score_aged_non_dual,
        RISK_SCORE_AGED_DUAL as risk_score_aged_dual,
        RISK_SCORE_DISABLED as risk_score_disabled,

        -- Utilization metrics
        READMISSION_RATE_PER_1000 as readmission_rate_per_1000,
        SNF_LENGTH_OF_STAY as snf_length_of_stay,

        -- Program participation flags
        MET_QUALITY_PERFORMANCE_STANDARD as met_quality_performance_standard,
        REDUCED_SHARED_SAVINGS_FLAG as reduced_shared_savings_flag,

        -- Performance categorization
        case
            when SAVINGS_RATE_PCT > 5 then 'High Saver'
            when SAVINGS_RATE_PCT between 0 and 5 then 'Moderate Saver'
            when SAVINGS_RATE_PCT between -5 and 0 then 'Slight Loss'
            when SAVINGS_RATE_PCT < -5 then 'High Loss'
            else 'Unknown'
        end as performance_category,

        -- Quality tier
        case
            when QUALITY_SCORE >= 90 then 'Excellent'
            when QUALITY_SCORE >= 80 then 'Good'
            when QUALITY_SCORE >= 70 then 'Fair'
            when QUALITY_SCORE < 70 then 'Needs Improvement'
            else 'Not Scored'
        end as quality_tier,

        -- Metadata
        DBT_LOADED_AT as dbt_loaded_at,
        current_timestamp() as dbt_updated_at

    from aco_staging
)

select * from aco_summary
