{{
    config(
        materialized='table'
    )
}}

with partd_categorized as (
    select
        brand_name,
        generic_name,
        year,
        quarter,
        'Part D' as program,

        -- Use drug_uses as category, or derive from generic name if null
        case
            when drug_uses is not null and drug_uses != '' then drug_uses
            when generic_name ilike '%insulin%' then 'Diabetes - Insulin'
            when generic_name ilike '%metformin%' then 'Diabetes - Oral'
            when generic_name ilike '%statin%' or generic_name ilike '%atorvastatin%' or generic_name ilike '%simvastatin%' then 'Cardiovascular - Statins'
            when generic_name ilike '%blood%' or generic_name ilike '%warfarin%' or generic_name ilike '%apixaban%' then 'Anticoagulants'
            when generic_name ilike '%antidepressant%' or generic_name ilike '%sertraline%' or generic_name ilike '%escitalopram%' then 'Mental Health - Antidepressants'
            when generic_name ilike '%antibiotic%' or generic_name ilike '%amoxicillin%' or generic_name ilike '%azithromycin%' then 'Antibiotics'
            when generic_name ilike '%asthma%' or generic_name ilike '%inhaler%' or generic_name ilike '%albuterol%' then 'Respiratory'
            when generic_name ilike '%cancer%' or generic_name ilike '%chemotherapy%' or generic_name ilike '%oncology%' then 'Oncology'
            else 'Other'
        end as category,

        total_spending,
        total_claims,
        total_beneficiaries

    from {{ ref('stg_cms__partd_spending_quarterly') }}
    where quarter is not null
),

partb_categorized as (
    select
        brand_name,
        generic_name,
        year,
        quarter,
        'Part B' as program,

        -- Categorize based on HCPCS description and generic name
        case
            when generic_name ilike '%cancer%' or generic_name ilike '%chemotherapy%' then 'Oncology'
            when generic_name ilike '%insulin%' then 'Diabetes - Insulin'
            when generic_name ilike '%immune%' or generic_name ilike '%antibody%' or generic_name ilike '%globulin%' then 'Immunotherapy'
            when generic_name ilike '%vaccine%' or generic_name ilike '%vaccination%' then 'Vaccines'
            when generic_name ilike '%infusion%' or generic_name ilike '%injection%' then 'Injectable Therapies'
            when generic_name ilike '%blood%' or generic_name ilike '%coagulation%' then 'Blood Products'
            when generic_name ilike '%pain%' or generic_name ilike '%analgesic%' then 'Pain Management'
            else 'Other'
        end as category,

        total_spending,
        total_claims,
        total_beneficiaries

    from {{ ref('stg_cms__partb_spending_quarterly') }}
    where quarter is not null
),

combined as (
    select * from partd_categorized
    union all
    select * from partb_categorized
),

aggregated as (
    select
        year,
        quarter,
        program,
        category,
        count(distinct concat(brand_name, '|', generic_name)) as drug_count,
        sum(total_spending) as total_spending,
        sum(total_claims) as total_claims,
        sum(total_beneficiaries) as total_beneficiaries,

        -- Calculate averages
        avg(total_spending) as avg_spending_per_drug,
        case
            when sum(total_claims) > 0 then sum(total_spending) / sum(total_claims)
            else 0
        end as avg_cost_per_claim

    from combined
    group by year, quarter, program, category
),

with_totals as (
    select
        *,
        sum(total_spending) over (partition by year, quarter, program) as program_total_spending
    from aggregated
),

final as (
    select
        year,
        quarter,
        year || '-' || quarter as period,
        program,
        category,
        drug_count,
        total_spending,
        total_claims,
        total_beneficiaries,
        avg_spending_per_drug,
        avg_cost_per_claim,

        -- Percent of program total
        (total_spending / nullif(program_total_spending, 0)) * 100 as pct_of_program_spend,

        -- Rank within program
        row_number() over (partition by year, quarter, program order by total_spending desc) as category_rank

    from with_totals
)

select * from final
order by program, year desc, quarter desc, category_rank
