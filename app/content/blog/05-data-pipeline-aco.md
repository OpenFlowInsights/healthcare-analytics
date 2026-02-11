---
title: "From Claims Files to Shared Savings: The Data Pipeline Your ACO Needs"
slug: "data-pipeline-aco"
date: "2026-01-25"
category: "Data Engineering"
readTime: "8 min read"
excerpt: "MSSP ACOs get 47 different file types from CMS. Most organizations are still processing them manually in Excel. Here's the end-to-end data architecture that turns raw feeds into actionable dashboards."
---

Your ACO got the shared savings model wrong this year. Not because your care management strategy was bad. Not because your providers didn't try. But because by the time you saw the data that mattered, it was too late to act on it.

This is the hidden crisis in MSSP ACO analytics: **the infrastructure problem**. CMS sends you everything you need to manage your attributed population, track spending, forecast shared savings, and close quality gaps. They send it in 47 different file formats, on inconsistent schedules, with 30–90 day lags, in structures designed for compliance reporting—not operational analytics.

Most ACOs spend thousands of hours per year manually downloading, cleaning, and merging these files. By the time the data hits a dashboard, the performance year is half over. The high-utilization patients have already hit the ED six times. The coding gaps are baked in. The spending trajectory is set.

The ACOs that consistently hit shared savings targets don't have better doctors or smarter care managers. They have **better data pipelines**.

## The CMS Data Landscape: What You're Actually Working With

Let's start with what CMS gives you (and when):

### Quarterly Claims Feeds (90-day lag)
- **Claims and Claims Line Feed (CCLF)**: Every Part A and Part B claim for your attributed beneficiaries
- **Comes in 9 separate file types**: CCLF1-9, each with different schemas
- **Volume**: For a 10,000-patient ACO, expect 500K–1M claim lines per quarter
- **Format**: Pipe-delimited text files with fixed-width columns, cryptic codes, no human-readable labels

### Monthly Eligibility Files (30-day lag)
- **Beneficiary-level demographics, risk scores, attribution status**
- **Updated monthly**, but you only find out someone left your ACO 30 days after they left
- **Critical for:** Tracking attribution changes, forecasting benchmark adjustments

### Annual Benchmark Files (once per year, mid-performance year)
- **Your historical expenditure baseline, regional adjustments, risk adjustment factors**
- **Comes in June/July**—which means you're 6 months into the performance year before you know your target
- **Critical for:** Shared savings forecasting

### Quality Reporting Files (quarterly)
- **ACO-27, ACO-38, and other eCQM data**
- **Comes 60 days after quarter close**
- **Critical for:** Hitting quality gates (which unlock shared savings)

### Ad-Hoc Supplemental Files
- **Provider rosters, service area assignments, financial reconciliation reports**
- **No consistent schedule**—you get them when CMS sends them
- **Critical for:** Understanding attribution logic, auditing discrepancies

**The problem:** Each of these files uses different beneficiary identifiers (BENE_ID vs. MBI vs. HICN), different date formats, different code sets (ICD-10 vs. CPT vs. HCPCS vs. DRG), and different grain (claim-level vs. line-level vs. beneficiary-level).

If you're trying to answer a simple question like **"Which patients drove our ED spending spike in Q2?"** you need to:
1. Join claims to eligibility (to confirm attribution)
2. Filter to ED claims (specific revenue codes + place of service)
3. Aggregate to patient level
4. Join to risk scores (to adjust for acuity)
5. Join to provider roster (to assign accountability)

That's 5 files, 3 different schemas, and a dozen data quality checks. Most ACOs do this in Excel. It takes 4 days. By the time you have the answer, Q3 is half over.

## The Data Pipeline Architecture That Works

Here's the infrastructure that lets ACOs move from **quarterly reporting** to **continuous performance management**:

### Layer 1: Ingestion & Storage (The Data Lake)

**Goal:** Get every CMS file into a structured, queryable format as soon as it arrives.

**Technology:**
- **Cloud storage** (AWS S3, Google Cloud Storage, Azure Blob): Store raw CMS files as soon as they're downloaded
- **Automated file detection**: Use cloud functions (AWS Lambda, Google Cloud Functions) to trigger processing when new files land
- **Metadata logging**: Track which files you've received, when, and what time period they cover

**Process:**
1. CMS posts files to SFTP server
2. Your automated script downloads them nightly
3. Files land in S3 (or equivalent) in a `/raw` folder
4. Metadata gets logged (file name, size, row count, date received)

**Why this matters:** You now have a **complete audit trail** of every file CMS ever sent you. When there's a discrepancy in your settlement report, you can trace it back to the source file. When CMS revises historical data (which they do), you can re-run your analysis without re-downloading.

### Layer 2: Transformation & Normalization (The Data Warehouse)

**Goal:** Turn 47 different file formats into a **unified data model** that humans can query.

**Technology:**
- **Cloud data warehouse** (Snowflake, Google BigQuery, Amazon Redshift): Modern SQL databases designed for analytics
- **Transformation tool** (dbt - data build tool): The industry standard for defining data transformations as code
- **Schema design**: Star schema with fact tables (claims, eligibility) and dimension tables (providers, diagnosis codes, procedure codes)

**Process:**
1. Raw CMS files get loaded into staging tables (one table per file type)
2. dbt models run SQL transformations to:
   - Standardize column names (`BENE_ID` → `beneficiary_id`)
   - Decode cryptic codes (`REV_CNTR_CD = '0450'` → `category = 'Emergency Room'`)
   - Join related files (attach beneficiary demographics to every claim)
   - Calculate derived fields (age at service, days since last visit, total claim cost)
3. Transformed data lands in clean, documented tables that analysts can query

**Example transformation (in dbt):**

```sql
-- models/claims_enriched.sql
select
  c.claim_id,
  c.beneficiary_id,
  b.date_of_birth,
  b.risk_score,
  c.service_date,
  c.primary_diagnosis_code,
  d.diagnosis_description,
  c.total_charge_amount,
  case
    when c.revenue_center_code in ('0450','0451','0452','0459') then 'ED'
    when c.revenue_center_code like '010%' then 'Inpatient'
    when c.place_of_service = '11' then 'Office Visit'
    else 'Other'
  end as service_category
from {{ ref('staging_claims') }} c
left join {{ ref('beneficiaries') }} b on c.beneficiary_id = b.beneficiary_id
left join {{ ref('diagnosis_codes') }} d on c.primary_diagnosis_code = d.code
```

**Why this matters:** Your analysts no longer need to know that CMS stores ED visits as revenue code '0450'. They just query `service_category = 'ED'` and get the answer in 2 seconds instead of 2 hours.

### Layer 3: Business Logic & Metrics (The Metrics Layer)

**Goal:** Define complex ACO performance metrics once, in code, so every dashboard uses the same calculation.

**Technology:**
- **dbt metrics** or **Looker LookML**: Define metrics like "total ED visits" or "risk-adjusted benchmark" as reusable calculations
- **Staging models**: Pre-aggregate commonly-used datasets (monthly spending by patient, quarterly quality measure performance)

**Process:**
1. Define metric logic once (e.g., "How do we calculate shared savings?")
2. Write SQL that implements the CMS methodology exactly
3. Expose the metric to BI tools as a reusable field

**Example metric definition:**

```yaml
# metrics/shared_savings.yml
metrics:
  - name: shared_savings_estimate
    description: "Projected shared savings based on current year performance"
    model: ref('performance_summary')
    calculation_method: derived
    expression: |
      (benchmark_amount - actual_spending) *
      case when quality_score >= 0.60 then 1.0 else 0.0 end *
      sharing_rate
```

**Why this matters:** Everyone in your organization—care managers, finance, executives—sees the **same number** when they ask "Are we on track for shared savings?" No more version control hell where the CFO's Excel model disagrees with the COO's dashboard.

### Layer 4: Dashboards & Applications (The User Interface)

**Goal:** Give every role in your organization the data they need, in the format they need, updated as often as they need.

**Technology:**
- **BI tools** (Tableau, Looker, Power BI): For executives, analysts, and leadership
- **Custom web apps** (Next.js, React, Vue): For operational users who need task lists and workflows
- **Embedded analytics** (in your EHR or care management platform): For providers who won't leave their existing tools

**Who needs what:**

| Role | View | Update Frequency |
|------|------|------------------|
| Executives | Shared savings forecast, quality score summary | Weekly |
| Finance | Detailed spending trends, benchmark analysis | Weekly |
| Care Managers | High-risk patient lists, gap closure tasks | Daily |
| Providers | Panel-level performance, attributed patient lists | Monthly |
| Network Team | Utilization by facility, referral pattern analysis | Monthly |

**Why this matters:** A CFO doesn't need patient-level lists. A care manager doesn't need 5-year trend lines. **Role-based dashboards** mean people spend 30 seconds finding what they need instead of 30 minutes digging through a 40-page report.

## The Implementation Roadmap (12 Weeks)

Most ACOs think this requires a year-long IT project and a $500K budget. It doesn't. Here's the realistic timeline:

### Weeks 1-2: Infrastructure Setup
- Set up cloud data warehouse (Snowflake free trial or BigQuery)
- Configure S3 bucket (or equivalent) for file storage
- Write automated download script for CMS SFTP

### Weeks 3-6: Data Ingestion
- Load historical CMS files (past 2 years) into staging tables
- Build dbt models for core entities (beneficiaries, claims, providers)
- Validate row counts and date ranges match CMS summary reports

### Weeks 7-9: Metric Definition
- Define 5-10 critical metrics (spending trend, quality performance, shared savings forecast)
- Build aggregated tables for common queries
- Test calculations against manual Excel models to ensure accuracy

### Weeks 10-12: Dashboard Build
- Build executive dashboard (shared savings forecast, quality summary)
- Build care management dashboard (high-risk patient list)
- Build provider scorecard (panel performance)

**Total cost (excluding staff time):**
- Cloud warehouse: $500–$2,000/month (depends on data volume and query frequency)
- Cloud storage: $50–$200/month
- dbt: Free (open-source) or $100/user/month (dbt Cloud for hosted version)
- BI tool: $15–$70/user/month (Looker, Tableau, Power BI)

**All-in: $3K–$10K/month**. For a 10,000-patient ACO, that's **$3–$10 per member per year**. Your first year of shared savings pays for a decade of infrastructure.

## The Organizational Shift: From Reporting to Operations

The hardest part of this transition isn't technical. It's cultural.

Most ACOs have a **quarterly reporting mindset**: Wait for data, process it, review it, report it to the board, file it away. The data team is separate from the operations team. Analytics is something that happens *after* the quarter ends, not *during* it.

High-performing ACOs have an **operational analytics mindset**: Data flows continuously, dashboards update weekly (or daily), and care managers check performance metrics the same way they check their email—because it's part of their daily workflow.

**What this requires:**
- **Executive buy-in**: The CFO and COO need to demand real-time data, not accept quarterly lag
- **Role clarity**: Someone owns the data pipeline (not a side project for your IT person)
- **Training**: Care managers, providers, and finance staff need to learn how to use the new dashboards
- **Feedback loops**: Dashboard users report bugs, request features, and help prioritize development

The ACOs that make this shift—from data as a compliance exercise to data as an operational tool—are the ones that hit shared savings targets year after year.

## The Bottom Line

You can't manage an ACO on 90-day-old data. You can't forecast shared savings on spreadsheets. And you can't close quality gaps if your team has to wait 6 weeks for a patient list.

The data infrastructure gap is the single biggest barrier between mediocre ACO performance and consistent shared savings. The good news: it's solvable. The technology is mature, affordable, and battle-tested. The only question is whether your organization is ready to build it.

**Next step:** [Talk to us about building your ACO data pipeline →](#)
