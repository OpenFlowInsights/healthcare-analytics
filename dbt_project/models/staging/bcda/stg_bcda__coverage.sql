{{
    config(
        materialized='view',
        tags=['bcda', 'fhir', 'coverage', 'staging']
    )
}}

with source as (
    select * from {{ source('bcda_raw', 'RAW_BCDA_COVERAGE') }}
),

parsed as (
    select
        -- FHIR identifiers
        DATA:id::string as coverage_id,
        DATA:resourceType::string as resource_type,

        -- Coverage status
        DATA:status::string as coverage_status,

        -- Beneficiary reference
        DATA:beneficiary.reference::string as beneficiary_reference,
        split_part(DATA:beneficiary.reference::string, '/', 2) as patient_id,

        -- Subscriber information
        DATA:subscriber.reference::string as subscriber_reference,
        DATA:subscriberId::string as subscriber_id,
        DATA:relationship.coding[0].code::string as relationship_code,
        DATA:relationship.coding[0].display::string as relationship,

        -- Payor information
        DATA:payor[0].reference::string as payor_reference,
        DATA:payor[0].display::string as payor_name,

        -- Coverage period
        DATA:period.start::date as coverage_start_date,
        DATA:period.end::date as coverage_end_date,

        -- Plan information
        DATA:type.coding[0].code::string as coverage_type_code,
        DATA:type.coding[0].display::string as coverage_type,
        DATA:class as coverage_classes,

        -- Group and plan details
        DATA:class[0].value::string as group_number,
        DATA:class[0].name::string as group_name,

        -- Order and dependent
        DATA:order::integer as coverage_order,
        DATA:dependent::string as dependent_number,

        -- Metadata
        DATA:meta.lastUpdated::timestamp_ntz as fhir_last_updated,
        current_timestamp() as dbt_loaded_at,

        -- Full raw data for reference
        DATA as raw_fhir_resource

    from source
)

select * from parsed
