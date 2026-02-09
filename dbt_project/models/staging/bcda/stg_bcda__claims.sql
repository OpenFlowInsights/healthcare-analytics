{{
    config(
        materialized='view',
        tags=['bcda', 'fhir', 'claims', 'eob', 'staging']
    )
}}

with source as (
    select * from {{ source('bcda_raw', 'RAW_BCDA_EXPLANATION_OF_BENEFIT') }}
),

parsed as (
    select
        -- FHIR identifiers
        DATA:id::string as claim_id,
        DATA:resourceType::string as resource_type,

        -- Patient reference
        DATA:patient.reference::string as patient_reference,
        split_part(DATA:patient.reference::string, '/', 2) as patient_id,

        -- Claim information
        DATA:status::string as claim_status,
        DATA:type.coding[0].code::string as claim_type_code,
        DATA:type.coding[0].display::string as claim_type,
        DATA:use::string as claim_use,

        -- Service period
        DATA:billablePeriod.start::timestamp_ntz as service_start_date,
        DATA:billablePeriod.end::timestamp_ntz as service_end_date,

        -- Financial information
        DATA:total[0].amount.value::decimal(18,2) as total_submitted,
        DATA:total[0].amount.currency::string as currency,
        DATA:payment.amount.value::decimal(18,2) as payment_amount,
        DATA:payment.type.coding[0].code::string as payment_type,

        -- Provider information
        DATA:provider.reference::string as provider_reference,
        DATA:facility.reference::string as facility_reference,

        -- Insurance information
        DATA:insurance[0].coverage.reference::string as coverage_reference,

        -- Diagnosis codes
        DATA:diagnosis as diagnosis_array,
        DATA:diagnosis[0].diagnosisCodeableConcept.coding[0].code::string as primary_diagnosis_code,
        DATA:diagnosis[0].diagnosisCodeableConcept.coding[0].display::string as primary_diagnosis_description,

        -- Procedure codes
        DATA:procedure as procedure_array,
        DATA:procedure[0].procedureCodeableConcept.coding[0].code::string as primary_procedure_code,

        -- Item details (line items)
        DATA:item as claim_items,

        -- Metadata
        DATA:created::timestamp_ntz as claim_created_date,
        DATA:meta.lastUpdated::timestamp_ntz as fhir_last_updated,
        current_timestamp() as dbt_loaded_at,

        -- Full raw data for reference
        DATA as raw_fhir_resource

    from source
)

select * from parsed
