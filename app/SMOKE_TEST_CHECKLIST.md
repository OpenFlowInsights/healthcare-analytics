# SSG Deployment - Smoke Test Checklist

## Prerequisites

Before running this checklist:
- [ ] Added all 7 Snowflake environment variables to Vercel
- [ ] Created Vercel Deploy Hook
- [ ] Added VERCEL_DEPLOY_HOOK as GitHub secret
- [ ] Ran Snowflake optimization SQL commands

---

## Step 1: Redeploy to Production

```bash
npx vercel --prod --force
```

Wait for build to complete (~2-3 minutes)

---

## Step 2: Test Dashboard Pages

### /dashboard

- [ ] **Page loads:** https://ofi-healthcare.vercel.app/dashboard
- [ ] **Status:** Returns 200 OK
- [ ] **Load time:** <500ms (check Network tab)
- [ ] **"Data as of" timestamp visible** in top-right corner
- [ ] **Data displays correctly:**
  - [ ] KPI cards show values
  - [ ] ACO rankings table populated
  - [ ] All numbers formatted correctly

### /drug-spending

- [ ] **Page loads:** https://ofi-healthcare.vercel.app/drug-spending
- [ ] **Status:** Returns 200 OK
- [ ] **Load time:** <500ms (check Network tab)
- [ ] **"Data as of" timestamp visible** in top-right corner
- [ ] **Data displays correctly:**
  - [ ] KPI cards show values
  - [ ] Trend chart renders
  - [ ] Bar chart renders (top 20 drugs)
  - [ ] Treemap renders
  - [ ] Table populated with drug data

---

## Step 3: Verify Static Rendering

Open Chrome DevTools → Network tab:

### Dashboard Page
- [ ] No requests to `/api/snowflake/*`
- [ ] No database queries visible
- [ ] Page served from Vercel edge (check `x-vercel-cache` header)
- [ ] Response time <200ms

### Drug Spending Page
- [ ] No requests to `/api/snowflake/*`
- [ ] No database queries visible
- [ ] Page served from Vercel edge
- [ ] Response time <200ms

---

## Step 4: Test Client-Side Interactivity

### ACO Dashboard

**Search:**
- [ ] Type "Massachusetts" in search box
- [ ] Table filters to show only MA ACOs
- [ ] No API calls in Network tab

**Sorting:**
- [ ] Click "Savings Rate" column header
- [ ] Table sorts by savings rate descending
- [ ] Click again → sorts ascending
- [ ] Arrow indicator shows sort direction
- [ ] No API calls

**Pagination:**
- [ ] Click "Show All 100 ACOs" button
- [ ] Table expands to show all rows
- [ ] Button changes to "Show Top 20"
- [ ] No API calls

### Drug Spending Dashboard

**Table Sorting:**
- [ ] Click "Brand Name" column header
- [ ] Table sorts alphabetically
- [ ] Click again → reverse sort
- [ ] No API calls

**Table Pagination:**
- [ ] Click "Show All" button
- [ ] Table expands to show all drugs
- [ ] Button changes to "Show Top 10"
- [ ] No API calls

**Chart Interactions:**
- [ ] Hover over trend chart lines
- [ ] Tooltips show values
- [ ] Hover over bar chart bars
- [ ] Tooltips show drug details
- [ ] Hover over treemap blocks
- [ ] Tooltips show category spending
- [ ] All interactions work without API calls

---

## Step 5: Verify Build Logs

Go to: https://vercel.com/tim-hudgins-projects/ofi-healthcare/deployments

Click on latest deployment → View Build Logs

Look for:
- [ ] `[BUILD] ===== Fetching ACO Dashboard Data =====`
- [ ] `[BUILD] ✓ Dashboard summary fetched: 1 row in XXXms`
- [ ] `[BUILD] ✓ ACO rankings fetched: 100 rows in XXXms`
- [ ] `[BUILD] ===== Fetching Drug Spending Dashboard Data =====`
- [ ] `[BUILD] ✓ Drug spending summary fetched: 1 row in XXXms`
- [ ] `[BUILD] ✓ Drug spending trend fetched: X rows in XXXms`
- [ ] `[BUILD] ✓ Drug drivers fetched: 100 rows in XXXms`
- [ ] `[BUILD] ✓ Drug categories fetched: X rows in XXXms`
- [ ] `[BUILD] Data timestamp: 2026-XX-XXTXX:XX:XX.XXXZ`
- [ ] Build output shows: `○ /dashboard` (Static)
- [ ] Build output shows: `○ /drug-spending` (Static)

---

## Step 6: Verify GitHub Actions Workflow

Go to: https://github.com/OpenFlowInsights/healthcare-analytics/actions

- [ ] **"Daily Data Rebuild" workflow visible** in workflows list
- [ ] **Manual trigger available** ("Run workflow" button)
- [ ] **Test manual trigger:**
  - Click "Run workflow"
  - Select branch: master
  - Enter reason: "Manual smoke test"
  - Click "Run workflow"
- [ ] **Workflow runs successfully:**
  - Green checkmark appears
  - View logs show: "Trigger Vercel Deploy Hook"
  - Vercel dashboard shows new deployment started

---

## Step 7: Verify Snowflake Configuration

Run in Snowflake console:

```sql
SHOW WAREHOUSES LIKE 'DEV_WH';
```

Check output:
- [ ] **auto_suspend:** 60 (seconds)
- [ ] **auto_resume:** TRUE
- [ ] **state:** SUSPENDED or STARTED (both OK)

Query recent usage:

```sql
SELECT
    QUERY_TEXT,
    EXECUTION_STATUS,
    START_TIME
FROM SNOWFLAKE.ACCOUNT_USAGE.QUERY_HISTORY
WHERE WAREHOUSE_NAME = 'DEV_WH'
  AND START_TIME > DATEADD(hour, -1, CURRENT_TIMESTAMP())
ORDER BY START_TIME DESC
LIMIT 10;
```

Verify:
- [ ] **Queries only during build** (not on page visits)
- [ ] **~8 queries per build** (2 for ACO, 4 for drug spending, 2 for trend/categories)
- [ ] **All queries successful** (EXECUTION_STATUS = 'SUCCESS')

---

## Step 8: Performance Validation

### Page Load Speed

Use Chrome DevTools → Network tab (with cache disabled):

**Dashboard:**
- [ ] Document load: <500ms
- [ ] First Contentful Paint: <200ms
- [ ] Largest Contentful Paint: <1s
- [ ] Time to Interactive: <1s

**Drug Spending:**
- [ ] Document load: <800ms
- [ ] First Contentful Paint: <300ms
- [ ] Largest Contentful Paint: <1.5s
- [ ] Time to Interactive: <1.5s

### Cache Verification

Visit page twice:

**First visit (cache miss):**
- [ ] x-vercel-cache: MISS
- [ ] Load time: ~200-500ms

**Second visit (cache hit):**
- [ ] x-vercel-cache: HIT
- [ ] Load time: <100ms

---

## Step 9: Data Freshness Verification

Check timestamp on both pages:

- [ ] **Dashboard timestamp:** Matches build time (within ~1 minute)
- [ ] **Drug spending timestamp:** Matches build time
- [ ] **Format:** "Feb 11, 2026, 7:50 PM UTC" (or similar)
- [ ] **Location:** Top-right corner of page

---

## Step 10: Mobile Responsiveness

Test on mobile viewport (Chrome DevTools → Toggle device toolbar):

**Dashboard:**
- [ ] KPI cards stack vertically
- [ ] Table scrolls horizontally
- [ ] Search box visible and functional
- [ ] Sort controls work
- [ ] Pagination button works

**Drug Spending:**
- [ ] KPI cards stack vertically
- [ ] Charts resize to fit screen
- [ ] Treemap displays correctly
- [ ] Table scrolls horizontally
- [ ] All interactions work

---

## Step 11: Error Handling

### Simulate Snowflake Failure

In Vercel dashboard, temporarily remove SNOWFLAKE_ACCOUNT env var:

- [ ] Redeploy (will fail)
- [ ] Build logs show connection error
- [ ] Deployment fails gracefully
- [ ] Previous deployment still serves traffic

**Restore env var and redeploy to fix**

### Test 404 Pages

- [ ] Visit https://ofi-healthcare.vercel.app/nonexistent
- [ ] Custom 404 page displays (or Next.js default)
- [ ] No JavaScript errors in console

---

## Step 12: Daily Rebuild Verification

**Initial Setup:**
- [ ] Verify cron schedule: `0 6 * * *` (6 AM UTC)
- [ ] Calculate next scheduled run:
  - 6 AM UTC = 1 AM EST = 10 PM PST
  - If today is Feb 11, next run: Feb 12 at 6 AM UTC

**After First Automated Run:**
- [ ] Check GitHub Actions history
- [ ] Verify workflow ran automatically at 6 AM UTC
- [ ] Check Vercel deployments for corresponding build
- [ ] Visit dashboard pages and verify new "Data as of" timestamp
- [ ] Confirm data is from latest Snowflake query

---

## Final Checklist Summary

### Critical (Must Pass)

- [x] Both dashboard pages load successfully
- [x] No API calls to Snowflake on page visit
- [x] All client-side interactions work
- [x] "Data as of" timestamp displays
- [x] Build logs show static generation (○)
- [x] GitHub Actions workflow exists
- [x] Snowflake auto-suspend/resume configured

### Important (Should Pass)

- [ ] Page load time <500ms
- [ ] Cache headers working (HIT on second visit)
- [ ] Manual workflow trigger works
- [ ] Snowflake queries only during build
- [ ] Mobile responsiveness works

### Optional (Nice to Have)

- [ ] First automated rebuild runs successfully (tomorrow)
- [ ] Error handling tested
- [ ] Performance metrics logged
- [ ] Cost monitoring set up

---

## Troubleshooting Guide

### Pages Don't Load (500 Error)

**Cause:** Missing Snowflake env vars or connection error

**Fix:**
1. Check Vercel env vars are all set
2. Test Snowflake connection locally
3. Redeploy with `npx vercel --prod --force`

### API Calls Still Visible

**Cause:** Build didn't complete or page not marked static

**Fix:**
1. Check build logs for errors
2. Verify pages show as `○ (Static)` not `λ (Dynamic)`
3. Clear browser cache (Ctrl+Shift+R)

### Data Not Updating

**Cause:** Daily rebuild not running or hook not configured

**Fix:**
1. Check GitHub Actions history
2. Verify VERCEL_DEPLOY_HOOK secret is set
3. Test manual trigger
4. Check Vercel deployments for new builds

### Charts Not Rendering

**Cause:** Data format issue or JavaScript error

**Fix:**
1. Open browser console for errors
2. Check build logs for data fetch errors
3. Verify data structure matches TypeScript interfaces

---

## Success Criteria

✅ All pages load in <500ms
✅ Zero database queries at runtime
✅ All interactivity preserved
✅ GitHub Actions workflow active
✅ Daily rebuilds scheduled
✅ Snowflake optimized for builds

**If all checks pass, the SSG deployment is complete and production-ready! 🎉**
