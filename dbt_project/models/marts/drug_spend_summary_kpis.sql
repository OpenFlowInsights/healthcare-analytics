{{
    config(
        materialized='table'
    )
}}

with latest_period as (
    -- Get the most recent quarter across both programs
    select max(year) as latest_year, max(quarter) as latest_quarter
    from (
        select year, quarter from {{ ref('stg_cms__partd_spending_quarterly') }}
        union
        select year, quarter from {{ ref('stg_cms__partb_spending_quarterly') }}
    )
),

previous_period as (
    -- Get the previous quarter
    select year as prev_year, quarter as prev_quarter
    from (
        select year, quarter,
               row_number() over (order by year desc, quarter desc) as rn
        from (
            select distinct year, quarter from {{ ref('stg_cms__partd_spending_quarterly') }}
            union
            select distinct year, quarter from {{ ref('stg_cms__partb_spending_quarterly') }}
        )
    )
    where rn = 2
),

partd_current as (
    select
        sum(total_spending) as partd_spending,
        sum(total_claims) as partd_claims,
        sum(total_beneficiaries) as partd_beneficiaries,
        count(distinct concat(brand_name, '|', generic_name)) as partd_unique_drugs
    from {{ ref('stg_cms__partd_spending_quarterly') }}
    cross join latest_period
    where year = latest_year and quarter = latest_quarter
),

partb_current as (
    select
        sum(total_spending) as partb_spending,
        sum(total_claims) as partb_claims,
        sum(total_beneficiaries) as partb_beneficiaries,
        count(distinct concat(brand_name, '|', generic_name)) as partb_unique_drugs
    from {{ ref('stg_cms__partb_spending_quarterly') }}
    cross join latest_period
    where year = latest_year and quarter = latest_quarter
),

partd_previous as (
    select
        sum(total_spending) as partd_prev_spending
    from {{ ref('stg_cms__partd_spending_quarterly') }}
    cross join previous_period
    where year = prev_year and quarter = prev_quarter
),

partb_previous as (
    select
        sum(total_spending) as partb_prev_spending
    from {{ ref('stg_cms__partb_spending_quarterly') }}
    cross join previous_period
    where year = prev_year and quarter = prev_quarter
),

top_drug_partd as (
    select
        brand_name,
        generic_name,
        total_spending,
        'Part D' as program
    from {{ ref('stg_cms__partd_spending_quarterly') }}
    cross join latest_period
    where year = latest_year and quarter = latest_quarter
    order by total_spending desc
    limit 1
),

top_drug_partb as (
    select
        brand_name,
        generic_name,
        total_spending,
        'Part B' as program
    from {{ ref('stg_cms__partb_spending_quarterly') }}
    cross join latest_period
    where year = latest_year and quarter = latest_quarter
    order by total_spending desc
    limit 1
),

top_drug_overall as (
    select * from top_drug_partd
    union all
    select * from top_drug_partb
    order by total_spending desc
    limit 1
),

summary as (
    select
        l.latest_year as year,
        l.latest_quarter as quarter,
        l.latest_year || '-' || l.latest_quarter as period,

        -- Part D metrics
        pc.partd_spending,
        pc.partd_claims,
        pc.partd_beneficiaries,
        pc.partd_unique_drugs,

        -- Part B metrics
        pb.partb_spending,
        pb.partb_claims,
        pb.partb_beneficiaries,
        pb.partb_unique_drugs,

        -- Combined metrics
        pc.partd_spending + pb.partb_spending as combined_total_spending,
        pc.partd_claims + pb.partb_claims as combined_total_claims,
        pc.partd_beneficiaries + pb.partb_beneficiaries as combined_total_beneficiaries,
        pc.partd_unique_drugs + pb.partb_unique_drugs as combined_unique_drugs,

        -- QoQ changes
        case
            when pp.partd_prev_spending > 0 then
                ((pc.partd_spending - pp.partd_prev_spending) / pp.partd_prev_spending) * 100
            else null
        end as partd_qoq_change_pct,

        case
            when ppb.partb_prev_spending > 0 then
                ((pb.partb_spending - ppb.partb_prev_spending) / ppb.partb_prev_spending) * 100
            else null
        end as partb_qoq_change_pct,

        case
            when (pp.partd_prev_spending + ppb.partb_prev_spending) > 0 then
                (((pc.partd_spending + pb.partb_spending) - (pp.partd_prev_spending + ppb.partb_prev_spending))
                 / (pp.partd_prev_spending + ppb.partb_prev_spending)) * 100
            else null
        end as combined_qoq_change_pct,

        -- Top drug
        td.brand_name as top_drug_brand,
        td.generic_name as top_drug_generic,
        td.total_spending as top_drug_spending,
        td.program as top_drug_program

    from latest_period l
    cross join partd_current pc
    cross join partb_current pb
    cross join partd_previous pp
    cross join partb_previous ppb
    cross join top_drug_overall td
)

select * from summary
