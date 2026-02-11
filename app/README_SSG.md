# Healthcare Analytics Platform - SSG Architecture

## Overview

A static healthcare analytics platform built with Next.js 14, featuring ACO performance tracking and drug spending analysis. Data is fetched from Snowflake once during build and served as static HTML from Vercel's global CDN.

**Live Site:** https://ofi-healthcare.vercel.app

---

## Architecture

### Static Site Generation (SSG)

This application uses **Static Site Generation** with daily data refreshes:

1. **Build Time:** Data fetched from Snowflake once per day
2. **Static HTML:** Pages generated and deployed to Vercel CDN
3. **Edge Delivery:** Pages served from CDN edge locations worldwide
4. **Client-Side Interactivity:** All filtering/sorting happens in-browser

```
┌─────────────┐
│   GitHub    │
│   Actions   │  Daily at 6 AM UTC
│   Workflow  │──────────────────┐
└─────────────┘                  │
                                 ▼
                         ┌───────────────┐
                         │    Trigger    │
                         │  Vercel Build │
                         └───────────────┘
                                 │
                                 ▼
                         ┌───────────────┐
                         │   Snowflake   │
                         │  Query Data   │ ← Build Time Only
                         └───────────────┘
                                 │
                                 ▼
                         ┌───────────────┐
                         │   Generate    │
                         │  Static HTML  │
                         └───────────────┘
                                 │
                                 ▼
                         ┌───────────────┐
                         │  Vercel CDN   │
                         │  Global Edge  │ ← Runtime: <100ms
                         └───────────────┘
```

---

## Features

### ACO Performance Dashboard

**Path:** `/dashboard`

- KPI cards (Total ACOs, Beneficiaries, Avg Savings Rate, Total Savings)
- Top 100 ACO rankings with client-side:
  - Search by name/state
  - Sort by any column
  - Pagination (show 20, expand to 100)

**Data Size:** ~20 KB (101 rows)
**Load Time:** <100ms (CDN)

### Drug Spending Dashboard

**Path:** `/drug-spending`

- KPI cards (Part D, Part B, Combined spending, QoQ change, Top drug)
- Quarterly spending trend chart (Part D, Part B, Combined)
- Top 20 drugs bar chart (horizontal)
- Drug category treemap (latest quarter)
- Detailed drug analysis table with client-side:
  - Sort by any column
  - Pagination (show 10, expand to all)

**Data Size:** ~66 KB (255 rows total)
**Load Time:** <100ms (CDN)

---

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Charts:** Recharts
- **Data Source:** Snowflake
- **Deployment:** Vercel
- **CI/CD:** GitHub Actions

---

## Local Development

### Prerequisites

- Node.js 18+
- npm or yarn
- Snowflake account with credentials

### Environment Variables

Create `.env.local`:

```bash
# Snowflake Configuration (required for builds)
SNOWFLAKE_ACCOUNT=your-account.snowflakecomputing.com
SNOWFLAKE_USERNAME=your-username
SNOWFLAKE_PASSWORD=your-password
SNOWFLAKE_DATABASE=DEV_DB
SNOWFLAKE_SCHEMA=STAGING_ANALYTICS
SNOWFLAKE_WAREHOUSE=DEV_WH
SNOWFLAKE_ROLE=ACCOUNTADMIN

# NextAuth (optional, for authentication)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here
```

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

Visit: http://localhost:3000

**Note:** Dev server won't fetch fresh data - it uses the data from the last build. Run `npm run build` to refresh data.

### Build Locally

```bash
npm run build
```

This will:
1. Connect to Snowflake
2. Fetch all dashboard data
3. Generate static HTML pages
4. Create optimized bundles

**Build Output:**
```
Route (app)
├ ○ /dashboard          3.98 kB   (Static)
├ ○ /drug-spending     118 kB     (Static)
```

**Build Logs:**
```
[BUILD] ===== Fetching ACO Dashboard Data =====
[BUILD] ✓ Dashboard summary fetched: 1 row in 469ms
[BUILD] ✓ ACO rankings fetched: 100 rows in 712ms
[BUILD] ✓ ACO dashboard data complete: 101 rows in 1225ms
```

---

## Deployment

### Automatic Deployment

**Trigger:** Daily at 6 AM UTC via GitHub Actions

**Workflow:** `.github/workflows/daily-deploy.yml`

**What it does:**
1. Triggers Vercel Deploy Hook
2. Vercel fetches latest code from `master` branch
3. Runs `npm run build` (queries Snowflake)
4. Generates static pages with fresh data
5. Deploys to global CDN

### Manual Deployment

#### Via GitHub Actions

```bash
# Using GitHub CLI
gh workflow run daily-deploy.yml

# Or via GitHub UI:
# Actions → Daily Data Rebuild → Run workflow
```

#### Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
npx vercel --prod
```

### Setup Automatic Deployments

1. **Create Vercel Deploy Hook**
   - Go to: https://vercel.com/YOUR_PROJECT/settings/git
   - Scroll to "Deploy Hooks"
   - Create hook named "Daily Data Rebuild" on branch `master`
   - Copy webhook URL

2. **Add GitHub Secret**
   - Go to: https://github.com/YOUR_REPO/settings/secrets/actions
   - Create secret: `VERCEL_DEPLOY_HOOK`
   - Paste webhook URL as value

3. **Verify Setup**
   - Go to: https://github.com/YOUR_REPO/actions
   - Manually trigger "Daily Data Rebuild" workflow
   - Check Vercel dashboard for new deployment

---

## Data Fetching

### Build-Time Data Fetching

**Location:** `lib/data/`

- `lib/data/aco.ts` - ACO dashboard data
- `lib/data/drug-spending.ts` - Drug spending dashboard data

**Functions:**
- `fetchACODashboardData()` - Fetches all ACO data
- `fetchDrugSpendingDashboardData()` - Fetches all drug spending data

**Called From:** Server Components during `next build`

### Data Freshness

Each dashboard displays:
```
Data as of: Feb 11, 2026, 7:50 PM UTC
```

This is the build timestamp - when data was last fetched from Snowflake.

**Update Frequency:** Daily (6 AM UTC)

**To change update frequency:**

Edit `.github/workflows/daily-deploy.yml`:

```yaml
# Every 6 hours
- cron: '0 */6 * * *'

# Twice daily (6 AM & 6 PM UTC)
- cron: '0 6,18 * * *'

# Weekdays only
- cron: '0 6 * * 1-5'
```

---

## Project Structure

```
app/
├── api/
│   └── auth/[...nextauth]/     # NextAuth.js (still dynamic)
├── dashboard/
│   ├── page.tsx                # Server component (fetches at build)
│   └── ACODashboardClient.tsx  # Client component (interactive UI)
├── drug-spending/
│   ├── page.tsx                # Server component (fetches at build)
│   └── DrugSpendingDashboardClient.tsx  # Client component
├── providers.tsx               # SessionProvider only
└── layout.tsx                  # Root layout

lib/
├── data/
│   ├── aco.ts                  # ACO data fetching functions
│   └── drug-spending.ts        # Drug spending data fetching
└── snowflake.ts                # Snowflake connection utility

.github/
└── workflows/
    └── daily-deploy.yml        # Daily rebuild workflow
```

---

## Performance

### Build Performance

| Metric | Value |
|--------|-------|
| Total Build Time | ~45 seconds |
| Data Fetch Time | ~2 seconds |
| Snowflake Queries | 8 queries |
| Total Rows Fetched | ~356 rows |
| Static Pages Generated | 19 pages |

### Runtime Performance

| Metric | Before (API) | After (SSG) | Improvement |
|--------|--------------|-------------|-------------|
| TTFB | 1-5s | <100ms | **10-50x faster** |
| Page Load | 2-5s | <200ms | **10-25x faster** |
| Interactivity | 2-5s | <500ms | **4-10x faster** |
| Database Queries | 4-6/visit | 0/visit | **100% reduction** |

### Cost Performance

| Metric | Before (API) | After (SSG) | Savings |
|--------|--------------|-------------|---------|
| Vercel Functions | 4000-6000/1K views | 0/1K views | 100% |
| Snowflake Credits | ~0.1/1K views | ~0.001/1K views | 99% |
| **Total Cost** | **$1.50/1K views** | **$0.05/1K views** | **97%** |

---

## Monitoring

### Build Monitoring

Check GitHub Actions:
```
https://github.com/YOUR_REPO/actions
```

Look for:
- ✅ "Daily Data Rebuild" workflow success
- ⏱️ Build duration
- 📊 Data rows fetched (in logs)

### Production Monitoring

Check Vercel Dashboard:
```
https://vercel.com/YOUR_PROJECT/analytics
```

Monitor:
- Page views
- Response times
- Error rates
- Bandwidth usage

### Snowflake Monitoring

Check Snowflake Query History:
```sql
SELECT *
FROM SNOWFLAKE.ACCOUNT_USAGE.QUERY_HISTORY
WHERE USER_NAME = 'APP_SERVICE'
  AND START_TIME > DATEADD(day, -7, CURRENT_TIMESTAMP())
ORDER BY START_TIME DESC;
```

Verify:
- Queries only during build window (6-6:30 AM UTC)
- No queries during normal page visits
- ~8 queries per build

---

## Troubleshooting

### Build Fails: "Snowflake Connection Error"

**Symptoms:** Build fails with connection timeout or invalid account error

**Causes:**
- Snowflake warehouse suspended
- Environment variables not set in Vercel
- Incorrect credentials

**Solutions:**
1. Check Vercel environment variables are set
2. Enable Snowflake warehouse auto-resume
3. Verify credentials in `.env.local` locally first

### Data Not Updating

**Symptoms:** Dashboard shows old data

**Causes:**
- Daily rebuild not running
- Build failed silently
- Browser caching old version

**Solutions:**
1. Check GitHub Actions for workflow failures
2. Manually trigger rebuild
3. Hard refresh browser (Ctrl+Shift+R)
4. Check "Data as of" timestamp on page

### Charts Not Rendering

**Symptoms:** Blank charts or JavaScript errors

**Causes:**
- Data format mismatch
- Field name case sensitivity (UPPERCASE vs lowercase)
- Missing data

**Solutions:**
1. Check browser console for errors
2. Verify data structure in React DevTools
3. Check build logs for data fetch errors

### Performance Degraded

**Symptoms:** Page loads slower than expected

**Causes:**
- Not served from CDN (cache miss)
- Large data payload
- Network issues

**Solutions:**
1. Check Vercel Analytics for cache hit rate
2. Verify page marked as Static in build output
3. Check browser Network tab for response source

---

## FAQs

### Why SSG instead of API routes?

**Benefits:**
- 10-50x faster page loads (CDN vs database)
- 97% cost reduction (no function executions)
- Unlimited scalability (static files)
- Better SEO (pre-rendered HTML)

**Trade-offs:**
- Data freshness (daily vs real-time)
- Requires rebuild to update data

### Can I change the rebuild frequency?

Yes. Edit `.github/workflows/daily-deploy.yml`:

```yaml
# Every 6 hours instead of daily
- cron: '0 */6 * * *'
```

More frequent builds = more cost (Snowflake credits).

### What if I need real-time data?

For real-time requirements:
1. Use Incremental Static Regeneration (ISR)
2. Implement on-demand revalidation
3. Or revert to API routes for specific pages

### How much does it cost?

**Monthly costs (assuming 100K page views/month):**

- Vercel: $20/month (Pro plan)
- Snowflake: ~$5/month (30 builds × $0.15/build)
- Total: **~$25/month**

Compare to API routes: **~$150/month**

### Can I deploy to other platforms?

Yes. The app is platform-agnostic:

- **Vercel** (recommended, easiest)
- **Netlify** (similar to Vercel)
- **AWS Amplify** (requires more setup)
- **Self-hosted** (nginx + PM2)

---

## Contributing

### Adding a New Dashboard

1. **Create data fetching function**
   ```typescript
   // lib/data/my-dashboard.ts
   export async function fetchMyDashboardData() {
     const config = getSnowflakeConfig();
     const data = await querySnowflake(sql, config);
     return data;
   }
   ```

2. **Create server component**
   ```typescript
   // app/my-dashboard/page.tsx
   export default async function MyDashboardPage() {
     const data = await fetchMyDashboardData();
     return <MyDashboardClient data={data} />;
   }
   ```

3. **Create client component**
   ```typescript
   // app/my-dashboard/MyDashboardClient.tsx
   "use client";
   export function MyDashboardClient({ data }) {
     // Interactive UI here
   }
   ```

4. **Test locally**
   ```bash
   npm run build  # Fetches data
   npm run dev    # View result
   ```

### Modifying Queries

Edit `lib/data/*.ts` files:

```typescript
// lib/data/aco.ts
export async function fetchACORankings() {
  const sql = `
    SELECT ...
    FROM DASHBOARD_ACO_RANKINGS
    ORDER BY SAVINGS_RATE_RANK
    LIMIT 200  -- Changed from 100
  `;
  // ...
}
```

Rebuild to test:
```bash
npm run build
```

---

## License

Proprietary - Open Flow Insights

---

## Support

- **Documentation:** See `/docs` folder
- **Issues:** https://github.com/YOUR_REPO/issues
- **Email:** support@openflowinsights.com

---

## Changelog

### v2.0.0 (2026-02-11) - SSG Refactor

- Converted from serverless API routes to SSG
- Added daily rebuild workflow
- Removed React Query dependency
- Added build-time logging
- Added data freshness timestamps
- Performance: 10-50x faster, 97% cost reduction

### v1.0.0 (2026-01-15) - Initial Release

- ACO Performance Dashboard
- Drug Spending Dashboard
- Serverless API architecture
- React Query for data fetching
