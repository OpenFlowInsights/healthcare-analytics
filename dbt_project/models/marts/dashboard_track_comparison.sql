{{
    config(
        materialized='table',
        tags=['marts', 'dashboard', 'track', 'comparison']
    )
}}

with aco_performance as (
    select * from {{ ref('aco_performance_summary') }}
),

track_aggregates as (
    select
        -- Track dimension
        coalesce(aco_track, 'Unknown') as aco_track,
        performance_year,

        -- Counts
        count(distinct aco_id) as total_acos,
        count(distinct case when savings_rate_pct > 0 then aco_id end) as acos_with_savings,
        count(distinct case when savings_rate_pct < 0 then aco_id end) as acos_with_losses,

        -- Beneficiary metrics
        sum(total_beneficiaries) as total_beneficiaries,
        avg(total_beneficiaries) as avg_beneficiaries_per_aco,

        -- Financial aggregates
        sum(benchmark_expenditure) as total_benchmark_expenditure,
        sum(total_expenditure) as total_actual_expenditure,
        sum(savings_losses) as total_savings_losses,
        sum(earned_shared_savings_payment) as total_earned_shared_savings,

        -- Average performance metrics
        avg(savings_rate_pct) as avg_savings_rate_pct,
        avg(cost_per_beneficiary) as avg_cost_per_beneficiary,
        avg(quality_score) as avg_quality_score,

        -- Performance rates
        round(
            count(case when savings_rate_pct > 0 then 1 end)::decimal /
            nullif(count(*), 0) * 100,
            2
        ) as pct_acos_with_savings,

        -- Quality metrics
        avg(risk_score_aged_non_dual) as avg_risk_score_aged_non_dual,
        avg(risk_score_aged_dual) as avg_risk_score_aged_dual,

        -- Utilization metrics
        avg(readmission_rate_per_1000) as avg_readmission_rate,

        -- Statistical metrics
        stddev(savings_rate_pct) as stddev_savings_rate,
        median(savings_rate_pct) as median_savings_rate,
        max(savings_rate_pct) as max_savings_rate,
        min(savings_rate_pct) as min_savings_rate,

        -- Metadata
        current_timestamp() as report_generated_at

    from aco_performance
    group by aco_track, performance_year
)

select * from track_aggregates
order by total_acos desc, aco_track
