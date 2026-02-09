{{
    config(
        materialized='table',
        tags=['marts', 'bcda', 'members', 'patients']
    )
}}

with patients as (
    select * from {{ ref('stg_bcda__patients') }}
),

claims as (
    select * from {{ ref('stg_bcda__claims') }}
),

claim_aggregates as (
    select
        patient_id,
        count(*) as total_claim_count,
        count(distinct claim_id) as unique_claim_count,
        sum(total_submitted) as total_submitted_amount,
        sum(payment_amount) as total_paid_amount,
        min(service_start_date) as first_service_date,
        max(service_end_date) as last_service_date,
        count(distinct claim_type) as distinct_claim_types,
        count(distinct provider_reference) as distinct_providers

    from claims
    group by patient_id
),

member_summary as (
    select
        -- Patient identifiers
        p.patient_id,

        -- Demographics
        p.first_name,
        p.last_name,
        p.gender,
        p.birth_date,
        datediff('year', p.birth_date, current_date()) as age,

        -- Contact information
        p.city,
        p.state,
        p.postal_code,

        -- Claim metrics
        coalesce(c.total_claim_count, 0) as total_claims,
        coalesce(c.unique_claim_count, 0) as unique_claims,
        coalesce(c.total_submitted_amount, 0) as total_submitted,
        coalesce(c.total_paid_amount, 0) as total_paid,
        c.first_service_date,
        c.last_service_date,
        coalesce(c.distinct_claim_types, 0) as claim_type_count,
        coalesce(c.distinct_providers, 0) as provider_count,

        -- Calculated metrics
        case
            when c.total_claim_count > 0
            then c.total_paid_amount / c.total_claim_count
            else 0
        end as avg_paid_per_claim,

        case
            when c.first_service_date is not null and c.last_service_date is not null
            then datediff('day', c.first_service_date, c.last_service_date)
            else null
        end as service_period_days,

        -- Member flags
        case when c.total_claim_count > 0 then 1 else 0 end as has_claims,
        case when c.total_claim_count >= 10 then 1 else 0 end as high_utilizer,
        case when c.total_paid_amount > 50000 then 1 else 0 end as high_cost_member,

        -- Metadata
        p.fhir_last_updated as patient_record_updated,
        current_timestamp() as report_generated_at

    from patients p
    left join claim_aggregates c
        on p.patient_id = c.patient_id
)

select * from member_summary
order by total_paid desc nulls last
