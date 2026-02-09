{{
    config(
        materialized='view',
        tags=['bcda', 'fhir', 'patients', 'staging']
    )
}}

with source as (
    select * from {{ source('bcda_raw', 'RAW_BCDA_PATIENT') }}
),

parsed as (
    select
        -- FHIR identifiers
        DATA:id::string as patient_id,
        DATA:resourceType::string as resource_type,

        -- Demographics
        DATA:name[0].given[0]::string as first_name,
        DATA:name[0].family::string as last_name,
        DATA:gender::string as gender,
        DATA:birthDate::date as birth_date,

        -- Contact information
        DATA:address[0].line[0]::string as address_line_1,
        DATA:address[0].city::string as city,
        DATA:address[0].state::string as state,
        DATA:address[0].postalCode::string as postal_code,
        DATA:telecom[0].value::string as phone,

        -- Identifiers
        DATA:identifier as identifiers,

        -- Extensions and additional data
        DATA:extension as extensions,
        DATA:maritalStatus.coding[0].code::string as marital_status,
        DATA:communication[0].language.coding[0].code::string as language,

        -- Metadata
        DATA:meta.lastUpdated::timestamp_ntz as fhir_last_updated,
        current_timestamp() as dbt_loaded_at,

        -- Full raw data for reference
        DATA as raw_fhir_resource

    from source
)

select * from parsed
