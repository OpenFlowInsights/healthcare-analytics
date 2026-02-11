# Drug Spending Dashboard Performance Diagnosis

## Issues Identified

### 1. **Blocking Data Fetching**
**Location:** `app/drug-spending/page.tsx:205`
```typescript
const isLoading = summaryLoading || trendLoading || driversLoading || categoriesLoading;
```
- Page waits for ALL 4 endpoints to complete before showing anything
- No progressive rendering - user sees blank screen until slowest query finishes

### 2. **Unbounded Queries**

#### drug-spend-trend endpoint
**Location:** `app/api/snowflake/drug-spend-trend/route.ts`
```sql
SELECT ... FROM STAGING_analytics.DRUG_SPEND_QUARTERLY_TREND
ORDER BY YEAR DESC, QUARTER DESC, PROGRAM
```
- **NO LIMIT CLAUSE** - fetches ALL quarterly data across all time
- If there are 5 years of data × 4 quarters × 3 programs = 60+ rows minimum
- Payload grows linearly with data history

#### drug-spend-categories endpoint
**Location:** `app/api/snowflake/drug-spend-categories/route.ts`
```sql
SELECT ... FROM STAGING_analytics.DRUG_SPEND_BY_CATEGORY
ORDER BY YEAR DESC, QUARTER DESC, PROGRAM, CATEGORY_RANK
```
- **NO LIMIT CLAUSE** - fetches ALL category data across all time
- If there are 20 categories × 4 quarters × 5 years × 3 programs = 1,200+ rows
- Likely the slowest endpoint

### 3. **No Caching**
- None of the 4 API routes set Cache-Control headers
- Browser re-fetches all data on every page visit
- No stale-while-revalidate strategy

### 4. **Inefficient Client-Side Filtering**
**Location:** `app/drug-spending/page.tsx:107-122`
```typescript
const filteredTrendData = useMemo(() => {
  if (!trendData) return [];
  return trendData.filter((d) => {
    const programMatch = selectedProgram === 'all' || d.PROGRAM === selectedProgram;
    const quarterMatch = selectedQuarter === 'all' || `${d.YEAR}-Q${d.QUARTER}` === selectedQuarter;
    return programMatch && quarterMatch;
  });
}, [trendData, selectedProgram, selectedQuarter]);
```
- Fetches all data, then filters client-side
- Should filter server-side and only return needed data

## Performance Impact Estimates

Based on code analysis:

| Endpoint | Estimated Rows | Estimated Payload | Query Time | Impact |
|----------|---------------|------------------|------------|--------|
| drug-spend-summary | 1 row | <1 KB | Fast | Low |
| drug-spend-drivers | 20-25 rows | ~5 KB | Fast | Low |
| **drug-spend-trend** | **60-100 rows** | **10-20 KB** | Medium | **High** |
| **drug-spend-categories** | **1,000-2,000 rows** | **100-200 KB** | Slow | **Critical** |

**Total payload:** ~120-230 KB (uncompressed)
**Estimated page load:** 2-5 seconds on slow connections

## Recommended Fixes

### HIGH PRIORITY
1. **Add default LIMIT to unbounded queries**
   - Limit trend to most recent 8 quarters (2 years)
   - Limit categories to top 10 per quarter

2. **Implement progressive loading**
   - Show summary/KPIs immediately
   - Load trend chart next
   - Load drivers and categories asynchronously

3. **Add server-side filtering**
   - Accept query params for year, quarter, program
   - Only return filtered data

### MEDIUM PRIORITY
4. **Add response caching**
   - Cache-Control: public, max-age=3600, stale-while-revalidate=86400
   - Data changes infrequently (monthly/quarterly)

5. **Add pagination to categories**
   - Show top 10 by default
   - "Show more" button to load additional

### LOW PRIORITY
6. **Virtual scrolling for large tables** (if needed after pagination)
7. **Lazy load charts** (defer non-critical visualizations)
8. **Consider materialized views** (if queries remain slow)
