-- Create S3 stage for CMS data
CREATE OR REPLACE STAGE DEV_DB.RAW.S3_CMS_STAGE
  URL = 's3://ofi-healthcare-data/cms-data/'
  STORAGE_INTEGRATION = EXTERNAL_STAGE;

-- Test stage
LIST @DEV_DB.RAW.S3_CMS_STAGE/aco/ LIMIT 5;
