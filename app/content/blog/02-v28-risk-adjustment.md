---
title: "V28 Risk Adjustment: What Changed and What It Means for Your RAF"
slug: "v28-risk-adjustment"
date: "2026-02-06"
category: "Risk Adjustment"
readTime: "6 min read"
excerpt: "CMS switched to V28 risk adjustment in 2024. The changes eliminated dozens of HCC codes, reweighted coefficients, and quietly shifted how chronic conditions map to risk scores. Here's what it means for your organization."
---

If your organization's average risk score dropped in 2024 and you're not sure why, V28 is the answer.

CMS transitioned from the V24 risk adjustment model to V28 for Medicare Advantage and most MSSP ACO calculations starting in 2024. On the surface, this looked like a technical update—new HCC mappings, updated coefficients, refined disease hierarchies. In practice, it represented the most significant shift in how Medicare pays for risk since the ACA.

For most organizations, V28 means **lower risk scores**. For some diagnoses, dramatically lower. If you're still using V24 logic to forecast revenue, close gaps, or prioritize coding—your numbers are wrong.

## What Actually Changed

V28 didn't just tweak the coefficients. It restructured how conditions map to Hierarchical Condition Categories (HCCs) and which diagnoses qualify at all.

### 1. HCC Count Dropped from 86 to 115 (But It's Complicated)

Yes, V28 technically has *more* HCC categories than V24. But it also **eliminated or consolidated** many high-value codes that plans and ACOs relied on for risk capture.

**Major eliminations:**
- **HCC 23 (Other Significant Endocrine Disorders)**: Gone. Conditions that previously mapped here now either fall into less-weighted categories or don't map at all.
- **HCC 176 (Complications of Specified Implanted Device or Graft)**: Removed. This was a significant risk capture code for post-surgical patients.
- **Pressure ulcer staging collapsed**: V24 had separate HCCs for Stage III and Stage IV ulcers. V28 combines them, reducing the total RAF contribution for patients with multiple ulcer stages.

### 2. Diabetes Got Reweighted (And Not in Your Favor)

Diabetes without complications (HCC 19 in V24) was one of the most common risk adjusters. In V28, uncomplicated diabetes now maps to **HCC 37** with a **lower coefficient** than its V24 equivalent.

For a Medicare Advantage plan with 10,000 diabetic members, this change alone can reduce annual revenue by $200K–$400K depending on case mix.

### 3. Hierarchies Got Stricter

V28 introduced more aggressive **condition hierarchies**—meaning if a patient has both a severe and a mild version of a condition, only the severe version counts (as it did in V24), but *more conditions now fall into hierarchical relationships*.

**Example:** Chronic kidney disease (CKD). In V24, you could sometimes capture both CKD and a related complication as separate HCCs. In V28, the hierarchies are tighter, so secondary codes get suppressed more often.

### 4. Discretionary HCCs Were Cut

V28 eliminated several "discretionary" codes that were considered prone to upcoding. These include:
- Certain mental health diagnoses that didn't require ongoing treatment
- Vague or non-specific codes (e.g., "unspecified" diabetes complications)
- Conditions that don't reliably predict future cost

CMS's stated goal: reduce "coding intensity" and align risk scores more closely with actual clinical severity. The practical result: organizations that relied on comprehensive coding of every possible diagnosis saw RAF drops of 3–8%.

## What It Means for Your RAF Scores

Let's translate this into dollars. Medicare Advantage payment rates in 2024 averaged around **$12,000 per member per year** (varies by county). A patient's RAF score is a multiplier on that base rate.

- RAF 1.0 = $12,000/year
- RAF 1.5 = $18,000/year
- RAF 0.8 = $9,600/year

**If your average RAF drops from 1.2 to 1.15** (a very realistic V28 impact), you're losing **$600 per member per year**. For a 5,000-member MA plan, that's a **$3 million revenue drop**.

For MSSP ACOs, the impact is more subtle but still real. Your **risk-adjusted benchmark** gets recalculated using V28. If your attributed population's RAF decreases, your allowable spending target decreases—but your actual costs don't automatically follow. This tightens your margin to hit shared savings.

## How to Adapt Your Coding and Documentation Strategy

The knee-jerk reaction to V28 is to "code harder"—to close every possible gap, capture every diagnosis, and maximize HCC coverage. That's not wrong, but it's incomplete. V28 rewards **specificity and clinical accuracy**, not volume.

### 1. Prioritize High-Impact Diagnoses That Survived V28

Not all HCCs were devalued. Some stayed the same or even increased in weight. Focus your coding efforts on:

- **Cancer diagnoses** (HCCs 17–20): Still high-value, and V28 didn't reduce their impact.
- **COPD and severe asthma** (HCC 277): Weighted heavily in V28, especially with exacerbations documented.
- **Heart failure** (HCC 221): One of the highest-weighted conditions—make sure it's captured annually.
- **Major psychiatric disorders** (HCCs 135–136): Still significant, but documentation must show active treatment.

### 2. Document Complications and Severity

V28 places more weight on **severity indicators**. A diagnosis of diabetes alone is worth less than it used to be. But **diabetes with chronic kidney disease** (HCC 37 + HCC 326) is still well-compensated.

**Provider education focus:**
- Document complications explicitly (e.g., "Type 2 diabetes with diabetic nephropathy" not just "Type 2 diabetes")
- Capture exacerbations and acute episodes (e.g., "COPD with acute exacerbation" vs. "COPD")
- Link conditions to ongoing treatment plans (CMS is watching for diagnosis codes that don't correlate with medication or visit patterns)

### 3. Build a V28-Specific Gap Closure Dashboard

Your old gap reports are wrong. They're based on V24 HCC mappings and coefficients. You need a **V28-native analytics layer** that:

- Maps ICD-10 codes to the correct V28 HCCs
- Calculates the incremental RAF impact of closing each gap (so you prioritize high-value gaps)
- Flags conditions that are close to falling out of the model due to lack of annual recapture
- Identifies patients whose RAF dropped year-over-year due to V28 changes (not clinical improvement)

If your EMR or population health platform hasn't updated to V28 logic yet, you're flying blind.

### 4. Forecast the Financial Impact on Your Book of Business

Don't wait until your next CMS payment reconciliation to see the damage. Run a retrospective analysis:

- Pull your 2023 claims data (when V24 was still in use)
- Re-score every patient using V28 logic
- Compare the aggregate RAF: 2023 actual (V24) vs. 2023 restated (V28)
- Multiply the difference by your membership and payment rate

This tells you your baseline V28 exposure. From there, you can set realistic targets for gap closure and coding improvement.

## The Long-Term Trend: More Changes Are Coming

V28 won't be the last update. CMS has made it clear that risk adjustment models will continue to evolve, with a focus on:

- **Reducing coding intensity** without penalizing legitimate clinical complexity
- **Incorporating social determinants of health** (SDoH) into risk scoring
- **Using predictive models** that look at utilization patterns, not just diagnosis codes

Organizations that treat risk adjustment as a "code everything" game will struggle. The winners will be those who build **data infrastructure** that can adapt to model changes, prioritize high-value clinical documentation, and forecast financial impact in real time.

## What You Should Do This Month

1. **Audit your current RAF performance** using V28 logic (not V24).
2. **Identify your top 10% of high-risk patients** and ensure all active diagnoses are captured.
3. **Train providers on V28-specific documentation**—emphasize complications, severity, and specificity.
4. **Build or buy a V28-native risk adjustment dashboard** that shows gap closure opportunities ranked by financial impact.

Risk adjustment isn't going away. But the rules changed. Make sure your strategy did too.

**Next step:** [See how risk adjustment dashboards surface high-value coding opportunities →](#)
