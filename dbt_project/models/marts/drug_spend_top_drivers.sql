{{
    config(
        materialized='table'
    )
}}

with all_periods as (
    select distinct year, quarter
    from {{ ref('stg_cms__partd_spending_quarterly') }}
    where quarter is not null
    union
    select distinct year, quarter
    from {{ ref('stg_cms__partb_spending_quarterly') }}
    where quarter is not null
),

latest_period as (
    -- Get the most recent period
    select year as latest_year, quarter as latest_quarter
    from all_periods
    order by year desc, quarter desc
    limit 1
),

partd_latest as (
    -- Get most recent quarter for Part D
    select
        p.brand_name,
        p.generic_name,
        p.year,
        p.quarter,
        'Part D' as program,
        p.total_spending,
        p.total_claims,
        p.total_beneficiaries,
        p.avg_spending_per_claim,
        p.avg_spending_per_beneficiary
    from {{ ref('stg_cms__partd_spending_quarterly') }} p
    cross join latest_period lp
    where p.quarter is not null
      and p.year = lp.latest_year
      and p.quarter = lp.latest_quarter
),

partb_latest as (
    -- Get most recent quarter for Part B
    select
        p.brand_name,
        p.generic_name,
        p.year,
        p.quarter,
        'Part B' as program,
        p.total_spending,
        p.total_claims,
        p.total_beneficiaries,
        p.avg_spending_per_claim,
        p.avg_spending_per_beneficiary
    from {{ ref('stg_cms__partb_spending_quarterly') }} p
    cross join latest_period lp
    where p.quarter is not null
      and p.year = lp.latest_year
      and p.quarter = lp.latest_quarter
),

previous_period as (
    -- Get the previous quarter
    select
        year as prev_year,
        quarter as prev_quarter
    from (
        select
            year,
            quarter,
            row_number() over (order by year desc, quarter desc) as rn
        from (
            select distinct year, quarter
            from {{ ref('stg_cms__partd_spending_quarterly') }}
            where quarter is not null
            union
            select distinct year, quarter
            from {{ ref('stg_cms__partb_spending_quarterly') }}
            where quarter is not null
        )
    )
    where rn = 2
),

partd_previous as (
    -- Get previous quarter for Part D
    select
        p.brand_name,
        p.generic_name,
        'Part D' as program,
        p.total_spending as prev_quarter_spending
    from {{ ref('stg_cms__partd_spending_quarterly') }} p
    cross join previous_period pp
    where p.quarter is not null
      and p.year = pp.prev_year
      and p.quarter = pp.prev_quarter
),

partb_previous as (
    -- Get previous quarter for Part B
    select
        p.brand_name,
        p.generic_name,
        'Part B' as program,
        p.total_spending as prev_quarter_spending
    from {{ ref('stg_cms__partb_spending_quarterly') }} p
    cross join previous_period pp
    where p.quarter is not null
      and p.year = pp.prev_year
      and p.quarter = pp.prev_quarter
),

combined_latest as (
    select * from partd_latest
    union all
    select * from partb_latest
),

combined_previous as (
    select * from partd_previous
    union all
    select * from partb_previous
),

drug_totals as (
    select
        coalesce(l.brand_name, '') as brand_name,
        coalesce(l.generic_name, '') as generic_name,
        l.program,
        l.year,
        l.quarter,
        l.total_spending,
        l.total_claims,
        l.total_beneficiaries,
        l.avg_spending_per_claim,
        l.avg_spending_per_beneficiary,
        p.prev_quarter_spending,

        -- QoQ growth rate
        case
            when p.prev_quarter_spending > 0 then
                ((l.total_spending - p.prev_quarter_spending) / p.prev_quarter_spending) * 100
            else null
        end as qoq_growth_pct

    from combined_latest l
    left join combined_previous p
        on l.brand_name = p.brand_name
        and l.generic_name = p.generic_name
        and l.program = p.program
),

with_totals as (
    select
        *,
        sum(total_spending) over () as grand_total_spending
    from drug_totals
),

final as (
    select
        brand_name,
        generic_name,
        program,
        year,
        quarter,
        total_spending,
        total_claims,
        total_beneficiaries,
        avg_spending_per_claim,
        avg_spending_per_beneficiary,
        qoq_growth_pct,

        -- Percent of total spend
        (total_spending / nullif(grand_total_spending, 0)) * 100 as pct_of_total_spend,

        -- Change from prior period (dollars)
        total_spending - coalesce(prev_quarter_spending, total_spending) as spending_change_dollars,

        -- Rank by total spending
        row_number() over (partition by program order by total_spending desc) as spend_rank

    from with_totals
)

select * from final
where spend_rank <= 50  -- Top 50 drugs per program
order by program, spend_rank
