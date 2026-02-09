{{
    config(
        materialized='table',
        tags=['marts', 'dashboard', 'rankings']
    )
}}

with aco_performance as (
    select * from {{ ref('aco_performance_summary') }}
),

ranked_acos as (
    select
        -- ACO identifiers
        aco_id,
        aco_name,
        aco_state,
        aco_track,
        performance_year,

        -- Key metrics
        total_beneficiaries,
        benchmark_expenditure,
        total_expenditure,
        savings_losses,
        earned_shared_savings_payment,
        savings_rate_pct,
        cost_per_beneficiary,
        quality_score,

        -- Performance indicators
        performance_category,
        quality_tier,

        -- Rankings
        row_number() over (order by savings_rate_pct desc nulls last) as savings_rate_rank,
        row_number() over (order by savings_losses desc nulls last) as total_savings_rank,
        row_number() over (order by quality_score desc nulls last) as quality_rank,
        row_number() over (order by total_beneficiaries desc nulls last) as beneficiary_rank,

        -- Percentile calculations
        percent_rank() over (order by savings_rate_pct) as savings_rate_percentile,
        percent_rank() over (order by quality_score) as quality_percentile,

        -- Performance flags
        case when savings_rate_pct > 0 then 1 else 0 end as is_saving,
        case when quality_score >= 80 then 1 else 0 end as meets_quality_threshold,

        -- Metadata
        current_timestamp() as report_generated_at

    from aco_performance
    where savings_rate_pct is not null  -- Exclude ACOs without performance data
)

select * from ranked_acos
order by savings_rate_rank
