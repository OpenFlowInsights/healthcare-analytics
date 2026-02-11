-- ============================================================================
-- Snowflake Warehouse Optimization for Daily SSG Builds
-- ============================================================================
--
-- Purpose: Configure warehouse to minimize costs while supporting daily builds
-- Expected cost: ~$0.15 per build × 30 builds/month = ~$4.50/month
--
-- ============================================================================

-- 1. Check current warehouse settings
SHOW WAREHOUSES;

-- 2. View detailed config for DEV_WH
DESC WAREHOUSE DEV_WH;

-- ============================================================================
-- RECOMMENDED SETTINGS
-- ============================================================================

-- Set auto-suspend to 60 seconds (1 minute)
-- This ensures warehouse suspends quickly after build completes
ALTER WAREHOUSE DEV_WH SET AUTO_SUSPEND = 60;

-- Enable auto-resume
-- This allows GitHub Actions to trigger builds even if warehouse is suspended
ALTER WAREHOUSE DEV_WH SET AUTO_RESUME = TRUE;

-- Set warehouse size (optional - only if you want to change it)
-- X-Small is sufficient for these queries (~2 seconds of compute time)
-- ALTER WAREHOUSE DEV_WH SET WAREHOUSE_SIZE = 'X-SMALL';

-- Set statement timeout to prevent runaway queries (optional)
-- ALTER WAREHOUSE DEV_WH SET STATEMENT_TIMEOUT_IN_SECONDS = 300;

-- ============================================================================
-- VERIFY SETTINGS
-- ============================================================================

-- Check that settings were applied
SHOW WAREHOUSES LIKE 'DEV_WH';

-- Verify configuration
SELECT
    "name" as WAREHOUSE_NAME,
    "size" as SIZE,
    "auto_suspend" as AUTO_SUSPEND_SECONDS,
    "auto_resume" as AUTO_RESUME,
    "state" as CURRENT_STATE,
    "comment" as COMMENT
FROM TABLE(RESULT_SCAN(LAST_QUERY_ID()));

-- ============================================================================
-- EXPECTED OUTPUT
-- ============================================================================
--
-- WAREHOUSE_NAME: DEV_WH
-- SIZE: X-SMALL
-- AUTO_SUSPEND_SECONDS: 60
-- AUTO_RESUME: TRUE
-- CURRENT_STATE: SUSPENDED (or STARTED)
--
-- ============================================================================
-- COST ESTIMATION
-- ============================================================================
--
-- X-Small warehouse: $4/credit-hour
-- Build query time: ~2 seconds
-- Cost per build: (2 sec / 3600 sec) × $4 = $0.0022 per build
-- Daily builds: 30/month
-- Monthly cost: $0.0022 × 30 = $0.066/month
--
-- Total Snowflake cost: ~$0.07/month for data warehouse + daily builds
--
-- Note: This is much cheaper than previous API route architecture
-- which queried Snowflake on every page visit.
--
-- ============================================================================
-- MONITORING QUERIES
-- ============================================================================

-- View recent query history for the warehouse
SELECT
    QUERY_ID,
    QUERY_TEXT,
    DATABASE_NAME,
    SCHEMA_NAME,
    EXECUTION_STATUS,
    TOTAL_ELAPSED_TIME / 1000 as ELAPSED_SECONDS,
    ROWS_PRODUCED,
    START_TIME,
    END_TIME
FROM SNOWFLAKE.ACCOUNT_USAGE.QUERY_HISTORY
WHERE WAREHOUSE_NAME = 'DEV_WH'
  AND START_TIME > DATEADD(day, -7, CURRENT_TIMESTAMP())
ORDER BY START_TIME DESC
LIMIT 20;

-- View credit usage for the warehouse
SELECT
    WAREHOUSE_NAME,
    SUM(CREDITS_USED) as TOTAL_CREDITS,
    SUM(CREDITS_USED) * 4 as ESTIMATED_COST_USD
FROM SNOWFLAKE.ACCOUNT_USAGE.WAREHOUSE_METERING_HISTORY
WHERE WAREHOUSE_NAME = 'DEV_WH'
  AND START_TIME > DATEADD(day, -30, CURRENT_TIMESTAMP())
GROUP BY WAREHOUSE_NAME;

-- Check when warehouse is being used
SELECT
    DATE_TRUNC('hour', START_TIME) as HOUR,
    COUNT(*) as QUERY_COUNT,
    SUM(CREDITS_USED) as CREDITS_USED
FROM SNOWFLAKE.ACCOUNT_USAGE.WAREHOUSE_METERING_HISTORY
WHERE WAREHOUSE_NAME = 'DEV_WH'
  AND START_TIME > DATEADD(day, -7, CURRENT_TIMESTAMP())
GROUP BY DATE_TRUNC('hour', START_TIME)
ORDER BY HOUR DESC;

-- ============================================================================
-- TROUBLESHOOTING
-- ============================================================================

-- If builds fail with "Warehouse is suspended" error:
-- 1. Check AUTO_RESUME is enabled:
--    SHOW WAREHOUSES LIKE 'DEV_WH';
-- 2. Manually start warehouse:
--    ALTER WAREHOUSE DEV_WH RESUME;
-- 3. Try build again

-- If costs are higher than expected:
-- 1. Check for queries outside build window (6 AM UTC):
--    Run monitoring query above
-- 2. Reduce AUTO_SUSPEND time to 30 seconds:
--    ALTER WAREHOUSE DEV_WH SET AUTO_SUSPEND = 30;
-- 3. Consider scheduling warehouse to only run during build window

-- ============================================================================
