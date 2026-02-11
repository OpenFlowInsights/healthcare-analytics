# SSG Refactor Audit - API Routes Analysis

## Overview
Converting from serverless API routes (Snowflake queries per request) to SSG (build-time data fetching + daily rebuilds).

---

## API Routes Inventory

### ACO Dashboard Routes

#### 1. `/api/snowflake/dashboard-summary`
**Query:**
```sql
SELECT
  TOTAL_ACOS,
  ACOS_WITH_SAVINGS,
  ACOS_WITH_LOSSES,
  TOTAL_BENEFICIARIES,
  TOTAL_BENCHMARK_EXPENDITURE,
  TOTAL_ACTUAL_EXPENDITURE,
  TOTAL_SAVINGS_LOSSES,
  AVG_SAVINGS_RATE_PCT,
  AVG_QUALITY_SCORE
FROM DASHBOARD_SUMMARY
LIMIT 1
```

**Response Shape:**
```typescript
{
  success: true,
  data: {
    TOTAL_ACOS: number,
    ACOS_WITH_SAVINGS: number,
    ACOS_WITH_LOSSES: number,
    TOTAL_BENEFICIARIES: number,
    TOTAL_BENCHMARK_EXPENDITURE: number,
    TOTAL_ACTUAL_EXPENDITURE: number,
    TOTAL_SAVINGS_LOSSES: number,
    AVG_SAVINGS_RATE_PCT: number,
    AVG_QUALITY_SCORE: number
  }
}
```

**Used By:** `app/dashboard/page.tsx`
**Dynamic Input:** None - returns single summary row
**SSG Strategy:** Fetch once at build time, no client-side params needed

---

#### 2. `/api/snowflake/aco-rankings`
**Query:**
```sql
SELECT
  ACO_ID,
  ACO_NAME,
  ACO_STATE,
  ACO_TRACK,
  TOTAL_BENEFICIARIES,
  SAVINGS_RATE_PCT,
  QUALITY_SCORE,
  SAVINGS_RATE_RANK,
  PERFORMANCE_CATEGORY
FROM DASHBOARD_ACO_RANKINGS
ORDER BY SAVINGS_RATE_RANK
LIMIT ${limit}  -- default: 20
```

**Response Shape:**
```typescript
{
  success: true,
  data: Array<{
    ACO_ID: string,
    ACO_NAME: string,
    ACO_STATE: string,
    ACO_TRACK: string,
    TOTAL_BENEFICIARIES: number,
    SAVINGS_RATE_PCT: number,
    QUALITY_SCORE: number,
    SAVINGS_RATE_RANK: number,
    PERFORMANCE_CATEGORY: string
  }>
}
```

**Used By:** `app/dashboard/page.tsx`
**Dynamic Input:** `limit` query param (optional, default 20)
**SSG Strategy:**
- Fetch top 100 at build time
- Client-side pagination/filtering with full dataset
- Estimated size: ~100 rows × 200 bytes = ~20 KB

---

### Drug Spending Dashboard Routes

#### 3. `/api/snowflake/drug-spend-summary`
**Query:**
```sql
SELECT
  YEAR,
  QUARTER,
  PERIOD,
  PARTD_SPENDING,
  PARTD_CLAIMS,
  PARTD_BENEFICIARIES,
  PARTD_UNIQUE_DRUGS,
  PARTB_SPENDING,
  PARTB_CLAIMS,
  PARTB_BENEFICIARIES,
  PARTB_UNIQUE_DRUGS,
  COMBINED_TOTAL_SPENDING,
  COMBINED_TOTAL_CLAIMS,
  COMBINED_TOTAL_BENEFICIARIES,
  COMBINED_UNIQUE_DRUGS,
  PARTD_QOQ_CHANGE_PCT,
  PARTB_QOQ_CHANGE_PCT,
  COMBINED_QOQ_CHANGE_PCT,
  TOP_DRUG_BRAND,
  TOP_DRUG_GENERIC,
  TOP_DRUG_SPENDING,
  TOP_DRUG_PROGRAM
FROM STAGING_analytics.DRUG_SPEND_SUMMARY_KPIS
LIMIT 1
```

**Response Shape:**
```typescript
{
  success: true,
  data: {
    YEAR: number,
    QUARTER: number,
    PERIOD: string,
    PARTD_SPENDING: number,
    PARTD_CLAIMS: number,
    // ... all KPI fields
  }
}
```

**Used By:** `app/drug-spending/page.tsx`
**Dynamic Input:** None
**SSG Strategy:** Fetch once at build time

---

#### 4. `/api/snowflake/drug-spend-trend`
**Query:**
```sql
SELECT
  YEAR,
  QUARTER,
  PERIOD,
  PROGRAM,
  TOTAL_SPENDING,
  TOTAL_CLAIMS,
  TOTAL_BENEFICIARIES,
  AVG_COST_PER_CLAIM,
  AVG_COST_PER_BENEFICIARY,
  QOQ_CHANGE_PCT,
  YOY_CHANGE_PCT,
  ROLLING_AVG_4Q
FROM STAGING_analytics.DRUG_SPEND_QUARTERLY_TREND
[WHERE program = '...' AND year = ... AND quarter = ...]
ORDER BY YEAR DESC, QUARTER DESC, PROGRAM
LIMIT ${limit}  -- default: 24
```

**Response Shape:**
```typescript
{
  success: true,
  data: Array<{
    YEAR: number,
    QUARTER: number,
    PERIOD: string,
    PROGRAM: string,
    TOTAL_SPENDING: number,
    TOTAL_CLAIMS: number,
    TOTAL_BENEFICIARIES: number,
    AVG_COST_PER_CLAIM: number,
    AVG_COST_PER_BENEFICIARY: number,
    QOQ_CHANGE_PCT: number,
    YOY_CHANGE_PCT: number,
    ROLLING_AVG_4Q: number
  }>
}
```

**Used By:** `app/drug-spending/page.tsx`
**Dynamic Input:**
- `limit` (default 24)
- `program` (Part D / Part B)
- `year`, `quarter` (optional filters)

**Current Client-Side Usage:**
- Frontend filters by program and quarter after fetching
- Chart displays trend data

**SSG Strategy:**
- Fetch ALL trend data at build time (~100 rows max = ~10 KB)
- Client-side filtering by program/quarter with useMemo
- No need to limit - full dataset is small

---

#### 5. `/api/snowflake/drug-spend-drivers`
**Query:**
```sql
SELECT
  BRAND_NAME,
  GENERIC_NAME,
  PROGRAM,
  YEAR,
  QUARTER,
  TOTAL_SPENDING,
  TOTAL_CLAIMS,
  TOTAL_BENEFICIARIES,
  AVG_SPENDING_PER_CLAIM,
  AVG_SPENDING_PER_BENEFICIARY,
  QOQ_GROWTH_PCT,
  PCT_OF_TOTAL_SPEND,
  SPENDING_CHANGE_DOLLARS,
  SPEND_RANK
FROM STAGING_analytics.DRUG_SPEND_TOP_DRIVERS
[WHERE PROGRAM = '...']
ORDER BY ${sortBy} ${sortOrder}
LIMIT ${limit}  -- default: 25
```

**Response Shape:**
```typescript
{
  success: true,
  data: Array<{
    BRAND_NAME: string,
    GENERIC_NAME: string,
    PROGRAM: string,
    YEAR: number,
    QUARTER: number,
    TOTAL_SPENDING: number,
    TOTAL_CLAIMS: number,
    TOTAL_BENEFICIARIES: number,
    AVG_SPENDING_PER_CLAIM: number,
    AVG_SPENDING_PER_BENEFICIARY: number,
    QOQ_GROWTH_PCT: number,
    PCT_OF_TOTAL_SPEND: number,
    SPENDING_CHANGE_DOLLARS: number,
    SPEND_RANK: number
  }>
}
```

**Used By:** `app/drug-spending/page.tsx`
**Dynamic Input:**
- `limit` (default 25, used with 50)
- `sortBy` (field name)
- `sortOrder` (ASC/DESC)
- `program` (Part D / Part B filter)

**Current Client-Side Usage:**
- Frontend does client-side sorting AFTER fetch
- Table pagination (show 10, expand to all)

**SSG Strategy:**
- Fetch top 100 drivers at build time (~15 KB)
- All sorting/filtering done client-side
- Table shows top 10 by default, "Show All" expands

---

#### 6. `/api/snowflake/drug-spend-categories`
**Query:**
```sql
SELECT
  YEAR,
  QUARTER,
  PERIOD,
  PROGRAM,
  CATEGORY,
  DRUG_COUNT,
  TOTAL_SPENDING,
  TOTAL_CLAIMS,
  TOTAL_BENEFICIARIES,
  AVG_SPENDING_PER_DRUG,
  AVG_COST_PER_CLAIM,
  PCT_OF_PROGRAM_SPEND,
  CATEGORY_RANK
FROM STAGING_analytics.DRUG_SPEND_BY_CATEGORY
[WHERE CATEGORY_RANK <= ${top_n} AND ...]
ORDER BY YEAR DESC, QUARTER DESC, PROGRAM, CATEGORY_RANK
LIMIT ${topN * maxQuarters * 2}  -- default: 15 * 4 * 2 = 120
```

**Response Shape:**
```typescript
{
  success: true,
  data: Array<{
    YEAR: number,
    QUARTER: number,
    PERIOD: string,
    PROGRAM: string,
    CATEGORY: string,
    DRUG_COUNT: number,
    TOTAL_SPENDING: number,
    TOTAL_CLAIMS: number,
    TOTAL_BENEFICIARIES: number,
    AVG_SPENDING_PER_DRUG: number,
    AVG_COST_PER_CLAIM: number,
    PCT_OF_PROGRAM_SPEND: number,
    CATEGORY_RANK: number
  }>
}
```

**Used By:** `app/drug-spending/page.tsx`
**Dynamic Input:**
- `top_n` (default 15)
- `max_quarters` (default 4)
- `program`, `year`, `quarter` (filters)

**Current Client-Side Usage:**
- Frontend filters to latest quarter for treemap
- Displays category breakdown

**SSG Strategy:**
- Fetch top 20 categories × 8 quarters = 160 rows (~20 KB)
- Client-side filtering by period/program
- Treemap shows latest quarter (client-side filter)

---

### Non-Snowflake Routes

#### 7. `/api/auth/[...nextauth]`
**Purpose:** NextAuth.js authentication
**Action:** KEEP - this is genuinely dynamic
**Note:** Not related to data fetching

---

## Summary Statistics

### Total Routes to Convert: 6
- ACO Dashboard: 2 routes
- Drug Spending Dashboard: 4 routes

### Estimated Static Data Size
| Route | Rows | Est. Size |
|-------|------|-----------|
| dashboard-summary | 1 | <1 KB |
| aco-rankings | 100 | ~20 KB |
| drug-spend-summary | 1 | <1 KB |
| drug-spend-trend | 100 | ~10 KB |
| drug-spend-drivers | 100 | ~15 KB |
| drug-spend-categories | 160 | ~20 KB |
| **Total** | **462** | **~66 KB** |

**All datasets are small enough to send to client for filtering.**

---

## Client-Side Interactivity Plan

### ACO Dashboard
- **Sorting:** Client-side with full 100 ACOs
- **Search/Filter:** Client-side with useMemo
- **Pagination:** Client-side (show 20, expand to 100)

### Drug Spending Dashboard
- **Program filter (Part D/B):** Client-side filter on full dataset
- **Quarter/Year filter:** Client-side filter with useMemo
- **Table sorting:** Client-side sort on full 100 drivers
- **Table pagination:** Client-side (show 10, expand to all)
- **Chart data:** Pre-computed trend for all quarters, filter client-side
- **Treemap:** Filter categories to latest quarter client-side

**No server-side filtering needed - all datasets fit comfortably in browser.**

---

## Refactor Strategy

### Phase 1: Create Data Layer
- Create `/lib/data/aco.ts`
- Create `/lib/data/drug-spending.ts`
- Move Snowflake queries into functions

### Phase 2: Convert Pages
- Convert `app/dashboard/page.tsx` to server component
- Convert `app/drug-spending/page.tsx` to server component
- Fetch data at top level
- Pass data to client components as props

### Phase 3: Update Client Components
- Remove `useQuery` hooks
- Accept data as props
- Implement client-side filtering with `useMemo`
- Implement client-side sorting/pagination

### Phase 4: Clean Up
- Delete API routes
- Remove React Query provider
- Remove Cache-Control headers

### Phase 5: CI/CD
- Create GitHub Actions workflow for daily rebuild
- Set up Vercel Deploy Hook
- Add build-time logging

### Phase 6: Testing
- Verify all pages show as Static in build output
- Test client-side interactions
- Verify data freshness footer

---

## Next Steps
1. Create data fetching functions
2. Convert dashboard pages
3. Update client components
4. Remove API routes
5. Set up daily rebuild
6. Update documentation
