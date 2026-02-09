{{
    config(
        materialized='table'
    )
}}

with partd_quarterly as (
    select
        year,
        quarter,
        'Part D' as program,
        sum(total_spending) as total_spending,
        sum(total_claims) as total_claims,
        sum(total_beneficiaries) as total_beneficiaries
    from {{ ref('stg_cms__partd_spending_quarterly') }}
    where quarter is not null
    group by year, quarter
),

partb_quarterly as (
    select
        year,
        quarter,
        'Part B' as program,
        sum(total_spending) as total_spending,
        sum(total_claims) as total_claims,
        sum(total_beneficiaries) as total_beneficiaries
    from {{ ref('stg_cms__partb_spending_quarterly') }}
    where quarter is not null
    group by year, quarter
),

combined as (
    select * from partd_quarterly
    union all
    select * from partb_quarterly
),

with_totals as (
    select
        year,
        quarter,
        program,
        total_spending,
        total_claims,
        total_beneficiaries,

        -- Create a sortable period field (YYYY-QN)
        year || '-' || quarter as period,

        -- Calculate avg cost per claim
        case
            when total_claims > 0 then total_spending / total_claims
            else 0
        end as avg_cost_per_claim,

        -- Calculate avg cost per beneficiary
        case
            when total_beneficiaries > 0 then total_spending / total_beneficiaries
            else 0
        end as avg_cost_per_beneficiary

    from combined
),

with_lag as (
    select
        *,
        lag(total_spending) over (partition by program order by year, quarter) as prev_quarter_spending,
        lag(total_spending, 4) over (partition by program order by year, quarter) as prev_year_spending
    from with_totals
),

final as (
    select
        year,
        quarter,
        period,
        program,
        total_spending,
        total_claims,
        total_beneficiaries,
        avg_cost_per_claim,
        avg_cost_per_beneficiary,

        -- Quarter-over-quarter change
        case
            when prev_quarter_spending > 0 then
                ((total_spending - prev_quarter_spending) / prev_quarter_spending) * 100
            else null
        end as qoq_change_pct,

        -- Year-over-year change
        case
            when prev_year_spending > 0 then
                ((total_spending - prev_year_spending) / prev_year_spending) * 100
            else null
        end as yoy_change_pct,

        -- 4-quarter rolling average
        avg(total_spending) over (
            partition by program
            order by year, quarter
            rows between 3 preceding and current row
        ) as rolling_avg_4q

    from with_lag
)

select * from final
order by program, year desc, quarter desc
