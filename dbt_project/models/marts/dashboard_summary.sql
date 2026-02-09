{{
    config(
        materialized='table',
        tags=['marts', 'dashboard', 'summary']
    )
}}

with aco_performance as (
    select * from {{ ref('aco_performance_summary') }}
),

summary_metrics as (
    select
        -- Counts
        count(distinct aco_id) as total_acos,
        count(distinct case when savings_rate_pct > 0 then aco_id end) as acos_with_savings,
        count(distinct case when savings_rate_pct < 0 then aco_id end) as acos_with_losses,
        count(distinct case when savings_rate_pct = 0 or savings_rate_pct is null then aco_id end) as acos_neutral,

        -- Beneficiary totals
        sum(total_beneficiaries) as total_beneficiaries,

        -- Financial aggregates
        sum(benchmark_expenditure) as total_benchmark_expenditure,
        sum(total_expenditure) as total_actual_expenditure,
        sum(savings_losses) as total_savings_losses,
        sum(earned_shared_savings_payment) as total_earned_shared_savings,

        -- Calculated aggregates
        avg(savings_rate_pct) as avg_savings_rate_pct,
        avg(cost_per_beneficiary) as avg_cost_per_beneficiary,
        avg(quality_score) as avg_quality_score,

        -- Performance distribution
        count(case when performance_category = 'High Saver' then 1 end) as high_savers,
        count(case when performance_category = 'Moderate Saver' then 1 end) as moderate_savers,
        count(case when performance_category = 'Slight Loss' then 1 end) as slight_loss,
        count(case when performance_category = 'High Loss' then 1 end) as high_loss,

        -- Quality distribution
        count(case when quality_tier = 'Excellent' then 1 end) as quality_excellent,
        count(case when quality_tier = 'Good' then 1 end) as quality_good,
        count(case when quality_tier = 'Fair' then 1 end) as quality_fair,
        count(case when quality_tier = 'Needs Improvement' then 1 end) as quality_needs_improvement,

        -- Min/Max metrics
        max(savings_rate_pct) as max_savings_rate,
        min(savings_rate_pct) as min_savings_rate,
        max(quality_score) as max_quality_score,
        min(quality_score) as min_quality_score,

        -- Metadata
        max(performance_year) as latest_performance_year,
        current_timestamp() as report_generated_at

    from aco_performance
)

select * from summary_metrics
