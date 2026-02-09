-- Truncate and reload with verbose error reporting
TRUNCATE TABLE DEV_DB.RAW.RAW_BCDA_PATIENT;

-- Test load one file with detailed error reporting
COPY INTO DEV_DB.RAW.RAW_BCDA_PATIENT
FROM @DEV_DB.RAW.S3_BCDA_STAGE/bcda/patients/
FILE_FORMAT = (
    TYPE = 'JSON'
    STRIP_OUTER_ARRAY = FALSE
)
PATTERN = 'patient_20260208_193007_0.ndjson'
ON_ERROR = CONTINUE
RETURN_FAILED_ONLY = TRUE;

-- Check result
SELECT COUNT(*), COUNT(DATA) as non_null_count FROM DEV_DB.RAW.RAW_BCDA_PATIENT;

-- Show sample
SELECT DATA:id::string as patient_id FROM DEV_DB.RAW.RAW_BCDA_PATIENT LIMIT 5;
