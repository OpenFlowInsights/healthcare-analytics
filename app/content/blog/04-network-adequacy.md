---
title: "Medicare Advantage Network Adequacy: A Data-Driven Approach"
slug: "network-adequacy"
date: "2026-01-30"
category: "Medicare Advantage"
readTime: "7 min read"
excerpt: "CMS network adequacy rules are strict—and getting stricter. Most plans use spreadsheets and manual audits to prove compliance. Here's how to use provider location data, member geography, and drive-time analysis to stay ahead of audits."
---

Every Medicare Advantage plan knows the CMS network adequacy rules: members must have access to primary care within 10 miles (urban) or 20 miles (rural), specialists within 25/50 miles, and so on. The rules are clear. Proving compliance is not.

Most plans approach network adequacy the same way: a spreadsheet with provider addresses, member ZIP codes, and manual distance calculations. This works until CMS asks for documentation. Then it becomes a scramble to justify every exception, prove every contracted provider is actually accepting patients, and show that "access" isn't just a pin on a map—it's a real appointment slot a member can book.

The plans that sail through CMS audits—and avoid corrective action plans—treat network adequacy as a **data and analytics problem**, not a compliance checkbox.

## The CMS Network Adequacy Rules (2026 Edition)

Let's start with what CMS actually requires. As of 2026, Medicare Advantage plans must meet these **time and distance standards**:

| Provider Type | Urban | Rural | Large Metro | Low Pop. Rural |
|---------------|-------|-------|-------------|----------------|
| Primary Care | 10 mi | 20 mi | 8 mi | 30 mi |
| Specialists | 25 mi | 50 mi | 20 mi | 75 mi |
| Hospitals | 15 mi | 30 mi | 10 mi | 45 mi |
| Pharmacies | 5 mi | 15 mi | 5 mi | 20 mi |

**Key clarifications from CMS guidance:**
- Distances are **drive-time**, not straight-line (as-the-crow-flies)
- Plans must meet standards for **90% of members** (not 100%)—but the 10% exception requires documented justification
- "Access" means the provider is **accepting new patients**, not just contracted
- Plans must update network adequacy files **quarterly** and submit to CMS annually

### The New Wrinkle: Provider Capacity Standards

In 2024, CMS added a **capacity requirement** that most plans are still scrambling to operationalize: plans must demonstrate that contracted providers have **sufficient appointment availability** to serve their attributed members.

Translation: You can't contract with a PCP who has 4,000 patients already and claim they're "accessible" to your 500 new members. CMS wants to see patient panel sizes, appointment wait times, and new patient acceptance status.

This turns network adequacy from a geographic exercise into a **capacity modeling problem**.

## Blind Spot #1: You're Measuring Distance Wrong

Most plans calculate network adequacy using **straight-line distance** (Haversine formula) or ZIP code centroids. This is fast, simple, and **wrong**.

**Real-world example:**
- Straight-line distance from member home to cardiologist: 12 miles
- Actual drive time: 47 minutes (due to river crossing, no direct route)
- CMS ruling: Does not meet 25-mile urban standard because drive-time equivalent exceeds threshold

CMS explicitly requires **drive-time analysis**. The good news: this is solvable with modern mapping APIs (Google Maps Distance Matrix, Mapbox, or OSRM for self-hosted). The bad news: it's computationally expensive if you're doing it wrong.

### How to Do Drive-Time Analysis at Scale

You don't need to calculate drive-time for every member to every provider (which would be millions of calculations). You need to:

1. **Geocode all member addresses** to lat/lon coordinates (use a service like Google Geocoding API or Census Geocoder)
2. **Geocode all provider addresses** (same process)
3. **Cluster members into service areas** (e.g., Census block groups or custom catchment zones)
4. **Calculate drive-time from each service area centroid to the nearest provider** (of each specialty type)
5. **Assign member-level adequacy flags** based on their service area

For a 50,000-member plan with 2,000 providers, this reduces your calculation from **100 million individual routes** to ~5,000 service area → nearest provider routes. Run it once a quarter, cache the results, and you have a real-time adequacy dashboard.

## Blind Spot #2: Your Contracted Providers Aren't Actually Available

CMS doesn't care that you have 47 PCPs within 10 miles if none of them are accepting new patients. And "accepting new patients" is a moving target—providers flip that status monthly based on panel capacity.

**The audit trap:**
- CMS requests your network adequacy files
- You submit a list showing 90% compliance
- CMS samples 20 providers and calls to verify new patient acceptance
- 8 of them say "no longer accepting new Medicare patients"
- Result: Your compliance rate drops below 90%, and you're in corrective action

### How to Track Provider Availability (Without Calling Every Office Monthly)

Build a **provider availability tracking system** that pulls from multiple sources:

1. **Your provider contracting database** (who's in-network, effective dates, terminations)
2. **Claims data** (which providers are actually seeing your members—if they haven't billed in 6 months, they might not be active)
3. **Automated availability checks** (monthly calls or web scrapes of provider scheduling systems—yes, this can be automated)
4. **Member services flags** (track complaints about "couldn't get an appointment" by provider)

Create a **provider status field** with values like:
- **Active & accepting**: Recently billed, confirmed accepting new patients
- **Active but at capacity**: Recently billed, not accepting new patients
- **Inactive**: Contracted but no recent claims activity
- **Terminated**: Contract ended

Only count "Active & accepting" providers in your adequacy calculations. Everything else is a compliance risk.

## Blind Spot #3: You're Not Tracking Exceptions

CMS allows plans to **fall short of network adequacy standards for up to 10% of members**—but only with proper documentation. Most plans don't track this until audit time.

**What CMS wants to see for exceptions:**
- Specific ZIP codes or counties where standards can't be met
- Evidence that you attempted to contract with available providers in those areas
- Alternative access arrangements (e.g., telehealth, transportation services, out-of-network exception process)

### Build an Exception Log

Create a database table for **network adequacy exceptions** with:
- **Member ID or service area**: Who's affected
- **Provider type**: What specialty is missing
- **Reason**: Why standards can't be met (no providers in area, providers declined contract, etc.)
- **Mitigation**: What alternative access you're providing
- **Review date**: When you'll reassess (quarterly)

This becomes your **audit defense file**. When CMS asks why 8% of your rural members don't have a cardiologist within 50 miles, you don't scramble. You pull the report that shows:

> "147 members in Catron County, NM fall outside cardiology access standards. Zero cardiologists within 75 miles. Contracted with telemedicine provider TeleHeart for remote consults. Provide transportation vouchers for in-person visits to Albuquerque (120 miles). Reviewed quarterly. No member complaints filed."

That's defensible. "We didn't notice until you asked" is not.

## How to Build a Network Adequacy Dashboard

Your network adequacy process should run **quarterly** (to match CMS reporting cycles) with real-time visibility into emerging gaps.

### Dashboard Components

**1. Compliance Summary**
- **Overall compliance rate** (% of members meeting all access standards)
- **Compliance by provider type** (PCP, cardiology, orthopedics, etc.)
- **Compliance by geography** (county-level heatmap)
- **Trend over time** (are you improving or degrading?)

**2. Gap Analysis**
- **Members without adequate access** (by specialty and location)
- **Provider coverage heatmap** (where are your network density gaps?)
- **Projected impact of provider terminations** (if Dr. Smith leaves, how many members lose access?)

**3. Provider Status Tracking**
- **Active vs. inactive providers** (by specialty)
- **Providers at capacity** (flagged for recruitment priority)
- **Providers with high complaint rates** (quality + access risk)

**4. Exception Documentation**
- **Current exceptions** (with reason, mitigation, and review date)
- **Exception trend** (are you adding more over time?)
- **Audit-ready export** (pre-formatted CMS submission file)

### The Automation Workflow

Quarterly network adequacy analysis should be **fully automated**:

1. **Week 1:** Data refresh
   - Pull latest member eligibility (from enrollment system)
   - Pull latest provider roster (from contracting database)
   - Pull claims activity (to verify provider is active)
   - Geocode any new addresses

2. **Week 2:** Analysis run
   - Calculate drive-time from service areas to nearest providers
   - Flag members outside access standards
   - Calculate compliance rates by specialty and geography
   - Identify new exceptions

3. **Week 3:** Review & action
   - Network management reviews gaps
   - Prioritizes provider recruitment in underserved areas
   - Updates exception log with new mitigations
   - Generates CMS submission file

4. **Week 4:** Reporting
   - Dashboard published to leadership
   - Exception report sent to compliance team
   - Provider recruitment priorities sent to network development

If this process takes more than 10 hours of human time per quarter, your automation isn't working.

## The Technology Stack You Need

You don't need enterprise GIS software or a $200K vendor solution. You need:

1. **A geocoding service** (Google Maps API, Mapbox, or open-source Nominatim)
2. **A drive-time calculation engine** (Google Distance Matrix API, Mapbox Directions API, or self-hosted OSRM)
3. **A data warehouse** (Snowflake, BigQuery, Redshift) to store member locations, provider locations, and drive-time matrices
4. **A spatial analysis tool** (PostGIS for SQL-based geospatial queries, or GeoPandas for Python-based analysis)
5. **A BI dashboard** (Tableau, Looker, Power BI) with map visualization support

**Cost estimate for 50K-member plan:**
- Geocoding (one-time): ~$500 for initial addresses, <$100/month for new addresses
- Drive-time API calls: ~$1,000/quarter (if you batch smartly)
- Infrastructure: Included in existing data warehouse spend

That's $5K–$10K/year to stay permanently audit-ready vs. $50K+ in consultant fees when CMS comes knocking.

## The Bottom Line

Network adequacy isn't a compliance form you fill out once a year. It's a **continuous monitoring process** that requires:

- Real drive-time calculations (not straight-line distance)
- Live provider availability tracking (not a stale contracted list)
- Exception documentation before CMS asks for it

The plans that treat this as a data problem—rather than a paperwork problem—are the ones that pass audits, avoid corrective action plans, and actually provide the access CMS expects.

Build the dashboard. Automate the quarterly run. Sleep well during audit season.

**Next step:** [See how MA plans use geospatial analytics for network planning →](#)
