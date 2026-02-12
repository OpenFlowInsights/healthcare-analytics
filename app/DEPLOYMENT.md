# ACO Performance Dashboard - Deployment Guide

This dashboard uses **Static Site Generation (SSG)** - data is fetched from Snowflake at build time and baked into static HTML/JSON served from Vercel's CDN.

## Architecture

```
Build time (Ubuntu server):
  Next.js build → Snowflake queries → Static HTML/JSON

Deploy:
  Upload static files → Vercel CDN → Global edge delivery

Runtime (user visits):
  Browser → Vercel CDN → Static HTML (no database calls)
```

**Key principle:** Build locally on the Ubuntu server, deploy prebuilt to Vercel. Vercel NEVER connects to Snowflake.

---

## Prerequisites

### 1. Snowflake Configuration

**Database & Schema:**
- Database: `DEV_DB`
- Schema: `MSSP_ACO`
- Required tables:
  - `ACO_PERFORMANCE_SUMMARY` (multi-year ACO financial/quality data)

**User Setup:**
- User: `APP_SERVICE`
- Role: `ACCOUNTADMIN`
- Warehouse: `DEV_WH`
- Auth: Key-pair JWT (no password)

### 2. Key-Pair JWT Setup

If not already configured, generate keys:

```bash
# Generate private key
openssl genrsa 2048 | openssl pkcs8 -topk8 -inform PEM -out rsa_key.p8 -nocrypt

# Generate public key
openssl rsa -in rsa_key.p8 -pubout -out rsa_key.pub
```

Assign public key in Snowflake:

```sql
-- Copy contents of rsa_key.pub (without header/footer, as one line)
ALTER USER APP_SERVICE SET RSA_PUBLIC_KEY='<public key content>';
```

**Security:**
- `rsa_key.p8` is in `.gitignore` - NEVER commit it
- Keep the private key secure on your build server only

### 3. Environment Variables

Create `.env.local` (optional - defaults are set):

```bash
# Snowflake connection (defaults in lib/snowflake.ts)
SNOWFLAKE_ACCOUNT=jic51019.us-east-1
SNOWFLAKE_USERNAME=APP_SERVICE
SNOWFLAKE_DATABASE=DEV_DB
SNOWFLAKE_SCHEMA=MSSP_ACO
SNOWFLAKE_WAREHOUSE=DEV_WH
SNOWFLAKE_ROLE=ACCOUNTADMIN
```

The private key is read from `rsa_key.p8` file automatically.

---

## Deployment Workflow

### Quick Deploy

```bash
cd /home/ubuntu/projects/healthcare-analytics/app

# Run the deployment script
./deploy.sh
```

### Manual Deploy (step-by-step)

```bash
# 1. Build locally (queries Snowflake on Ubuntu server)
npm run build

# 2. Package for Vercel
npx vercel build --prod

# 3. Deploy prebuilt files to Vercel CDN
npx vercel deploy --prebuilt --prod
```

### First-Time Setup

If this is your first deployment:

```bash
npx vercel build --prod
# CLI will ask: "No Project Settings found locally. Run vercel pull?"
# Type: Y
# Link to your Vercel project

# Then re-run:
npx vercel build --prod
npx vercel deploy --prebuilt --prod
```

---

## Daily Rebuild

The dashboard should be rebuilt daily to fetch fresh data from Snowflake.

### Option A: Cron on Ubuntu Server (Recommended)

```bash
crontab -e
```

Add:

```cron
# Rebuild ACO dashboard daily at 1 AM EST (6 AM UTC)
0 6 * * * cd /home/ubuntu/projects/healthcare-analytics/app && ./deploy.sh >> /var/log/aco-dashboard-rebuild.log 2>&1
```

### Option B: GitHub Actions (Self-Hosted Runner)

Create `.github/workflows/daily-rebuild.yml`:

```yaml
name: Daily ACO Dashboard Rebuild
on:
  schedule:
    - cron: '0 6 * * *'  # 6 AM UTC / 1 AM EST
  workflow_dispatch:       # Manual trigger

jobs:
  rebuild:
    runs-on: self-hosted   # Runs on your Ubuntu server
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build
      - run: npx vercel build --prod
      - run: npx vercel deploy --prebuilt --prod
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
```

---

## Data Flow

### Build Time (Snowflake Queries)

1. **Year discovery:** Fetch all available performance years from `ACO_PERFORMANCE_SUMMARY`
2. **Per-year data:** For each year:
   - Summary KPIs (total ACOs, beneficiaries, savings, quality)
   - ACO rankings (all ACOs sorted by savings rate)
3. **Multi-year structure:** All years bundled into `MultiYearDashboardData`
4. **Static generation:** Data baked into static pages

### Runtime (User Interaction)

- Year selector: Client-side filtering (no API calls)
- Search & filters: Client-side (no API calls)
- View navigation: Client-side tab switching
- Comparisons: Client-side percentile calculations

**Zero runtime database queries.**

---

## Dashboard Features

### View 1: ACO Performance
- Year-over-year KPI cards with delta indicators
- Searchable, sortable ACO rankings table
- Year selector (filters all data)
- Click ACO row → navigate to Comparison view

### View 2: ACO Comparison
- Select ACO to benchmark
- Filter comparison group by:
  - Track (BASIC/ENHANCED levels)
  - State
  - Beneficiary count range
- Comparison metrics: savings rate, quality score, beneficiaries
- Percentile ranks and group statistics

### View 3: ACO Participants
- Select ACO to view providers
- Provider roster table (when provider data is loaded)
- Composition statistics (TINs, NPIs, FQHC share, geographic spread)
- Placeholder messaging if provider data not available

---

## Troubleshooting

### "Invalid account" error
- Use correct account format: `jic51019.us-east-1`
- NOT: `RRISPXQ-JUC46944` or `JIC51019`

### "Invalid private key" error
- Ensure `rsa_key.p8` exists in project root
- Check file permissions: readable by the build process
- Verify key was generated correctly

### Build fails on Vercel
- **This is expected!** Vercel cannot reach Snowflake
- Always build locally and deploy prebuilt
- Disable auto-deploy in Vercel project settings

### Page over 19 MB
- Dashboard uses multi-year data - if too large:
  - Limit years loaded (modify `fetchACODashboardData`)
  - Add `LIMIT` clauses to queries
  - Consider hybrid approach for very large datasets

### No data / empty dashboard
- Check Snowflake schema: `MSSP_ACO`
- Verify table exists: `ACO_PERFORMANCE_SUMMARY`
- Check table has data for multiple years
- Review build logs for query errors

---

## Performance

| Metric | Target | Actual |
|--------|--------|--------|
| Page load (CDN cached) | <100ms | ✓ |
| Page load (CDN cold) | <200ms | ✓ |
| Build time | <60s | ✓ |
| Runtime DB queries | 0 | ✓ |
| Static page size | <10 MB | ✓ |

---

## Maintenance

### Adding New Performance Years

When CMS releases new PUF data:

1. Load new year data into `MSSP_ACO.ACO_PERFORMANCE_SUMMARY`
2. Rebuild dashboard: `./deploy.sh`
3. New year automatically appears in year selector

### Updating Provider Data

To populate the Participants view:

1. Download MSSP Provider-level PUF from data.cms.gov
2. Load into `RAW.RAW_MSSP_ACO_PROVIDERS` table
3. Run dbt models to create `MSSP_ACO.ACO_PROVIDERS`
4. Update data fetching in `lib/data/aco.ts`
5. Rebuild: `./deploy.sh`

### Schema Changes

If Snowflake schema changes:

1. Update TypeScript interfaces in `lib/data/aco.ts`
2. Update SQL queries to match new field names
3. Test locally: `npm run build`
4. Deploy: `./deploy.sh`

---

## Support

- **Deployment issues:** Check `/home/ubuntu/skills/ssg-dashboard/SKILL.md`
- **Dashboard features:** Reference skill at `.claude/skills/aco-dashboard-skill/`
- **Snowflake connection:** See `lib/snowflake.ts` configuration

---

**Last Updated:** 2026-02-12
