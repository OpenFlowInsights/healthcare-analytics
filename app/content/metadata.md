# Open Flow Insights — SEO Metadata

Page titles, meta descriptions, Open Graph tags, and structured data for all routes.

---

## Homepage (/)

**Title:** Open Flow Insights | Healthcare Analytics Dashboards for ACOs & Medicare Advantage

**Meta Description:** Custom analytics dashboards for MSSP ACOs and Medicare Advantage plans. Track shared savings, risk adjustment, quality measures, and prior authorization in real time.

**OG Tags:**
- og:title: "Open Flow Insights | Healthcare Analytics Dashboards"
- og:description: "Turn CMS data into confident decisions. Real-time dashboards for shared savings, risk adjustment, and quality measures."
- og:image: "/assets/og/homepage.png" (placeholder)
- og:type: "website"
- og:url: "https://ofi-healthcare.vercel.app/"

**Keywords:** MSSP analytics, Medicare Advantage dashboards, ACO shared savings, risk adjustment analytics, HEDIS reporting, healthcare data warehouse

---

## Dashboard Gallery (/dashboards)

**Title:** Analytics Dashboards | MSSP, Risk Adjustment & Quality Tools | Open Flow Insights

**Meta Description:** Explore custom-built analytics dashboards for MSSP shared savings, V28 risk adjustment, quality gap closure, and prior authorization burden analysis.

**OG Tags:**
- og:title: "Healthcare Analytics Dashboards | Open Flow Insights"
- og:description: "Custom dashboards for ACOs, Medicare Advantage plans, and health systems. See shared savings, risk gaps, and quality performance in real time."
- og:image: "/assets/og/dashboards.png" (placeholder)
- og:type: "website"

**Keywords:** MSSP dashboard, risk adjustment dashboard, quality measure tracking, prior authorization analytics, ACO performance dashboard

---

## Drug Spending Dashboard (/drug-spending)

**Title:** Medicare Part D Drug Spending Analytics | Open Flow Insights

**Meta Description:** Interactive dashboard analyzing Medicare Part D drug spending by specialty, manufacturer, and claim type. Explore trends, utilization patterns, and cost drivers.

**OG Tags:**
- og:title: "Medicare Part D Drug Spending Dashboard"
- og:description: "Analyze Part D spending by specialty, drug, and claim type. Interactive charts and data tables for healthcare analytics."
- og:image: "/assets/og/drug-spending.png" (placeholder)
- og:type: "website"

**Keywords:** Medicare Part D, drug spending analysis, prescription analytics, specialty pharmacy, pharmacy benefit management

---

## Blog Listing (/blog)

**Title:** Healthcare Analytics Blog | MSSP, Risk Adjustment & Quality Insights | Open Flow Insights

**Meta Description:** In-depth analysis of MSSP shared savings, V28 risk adjustment, quality measure performance, and healthcare data architecture. Written for ACOs and Medicare Advantage plans.

**OG Tags:**
- og:title: "Healthcare Analytics Blog | Open Flow Insights"
- og:description: "Expert insights on MSSP, risk adjustment, quality measures, and healthcare data engineering."
- og:image: "/assets/og/blog.png" (placeholder)
- og:type: "website"

**Keywords:** healthcare analytics blog, MSSP insights, risk adjustment strategy, HEDIS measures, ACO performance

---

## Blog Post (Dynamic: /blog/[slug])

**Title Pattern:** [Post Title] | Open Flow Insights Blog

**Meta Description:** [Post Excerpt - pulled from frontmatter]

**OG Tags:**
- og:title: [Post Title]
- og:description: [Post Excerpt]
- og:image: "/assets/og/blog-default.png" (placeholder - can be post-specific)
- og:type: "article"
- og:article:published_time: [Post Date]
- og:article:author: "Open Flow Insights"
- og:article:tag: [Post Category]

---

## Data Tools (/data-tools)

**Title:** Data Tools | SnowQuery SQL Interface | Open Flow Insights

**Meta Description:** Natural language SQL query tool for healthcare data. Ask questions about your data warehouse in plain English, get SQL queries and results instantly.

**OG Tags:**
- og:title: "Data Tools | SnowQuery | Open Flow Insights"
- og:description: "Natural language SQL query interface for Snowflake data warehouses. Built for healthcare analytics teams."
- og:image: "/assets/og/data-tools.png" (placeholder)
- og:type: "website"

**Keywords:** SQL query tool, natural language SQL, Snowflake query interface, healthcare data tools

---

## About Page (/about) — If Created

**Title:** About Open Flow Insights | Healthcare Analytics Consulting

**Meta Description:** Open Flow Insights builds custom analytics dashboards and data infrastructure for ACOs, Medicare Advantage plans, and value-based care organizations.

**OG Tags:**
- og:title: "About Open Flow Insights"
- og:description: "We build the analytics infrastructure healthcare organizations wish they had. Custom dashboards, data warehouses, and ongoing support."
- og:image: "/assets/og/about.png" (placeholder)
- og:type: "website"

---

## Services Page (/services) — If Created

**Title:** Healthcare Analytics Services | Custom Dashboards & Data Warehouses | Open Flow Insights

**Meta Description:** Custom analytics services for healthcare organizations: MSSP dashboards, risk adjustment analytics, quality reporting, data warehouse setup, and ongoing support.

**OG Tags:**
- og:title: "Healthcare Analytics Services | Open Flow Insights"
- og:description: "Custom dashboards, data warehouses, and analytics consulting for ACOs and Medicare Advantage plans."
- og:image: "/assets/og/services.png" (placeholder)
- og:type: "website"

**Keywords:** healthcare analytics consulting, custom dashboard development, data warehouse services, MSSP consulting, risk adjustment services

---

## Contact Page (/contact) — If Created

**Title:** Contact Open Flow Insights | Request a Demo or Consultation

**Meta Description:** Get in touch with Open Flow Insights to discuss custom analytics dashboards, data warehouse projects, or ongoing analytics support for your healthcare organization.

**OG Tags:**
- og:title: "Contact Open Flow Insights"
- og:description: "Request a demo or consultation for custom healthcare analytics dashboards."
- og:image: "/assets/og/contact.png" (placeholder)
- og:type: "website"

---

## Default Fallback (For Routes Not Listed Above)

**Title:** Open Flow Insights | Healthcare Analytics

**Meta Description:** Custom analytics dashboards and data infrastructure for healthcare organizations. MSSP, risk adjustment, quality measures, and more.

**OG Tags:**
- og:title: "Open Flow Insights"
- og:description: "Healthcare analytics dashboards and consulting."
- og:image: "/assets/og/default.png" (placeholder)
- og:type: "website"

---

## Structured Data (JSON-LD)

### Organization Schema (Include on All Pages)

```json
{
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  "name": "Open Flow Insights",
  "description": "Healthcare analytics consulting and custom dashboard development for ACOs, Medicare Advantage plans, and value-based care organizations.",
  "url": "https://ofi-healthcare.vercel.app",
  "logo": "https://ofi-healthcare.vercel.app/assets/icons/logo.svg",
  "sameAs": [
    "https://github.com/OpenFlowInsights"
  ],
  "address": {
    "@type": "PostalAddress",
    "addressCountry": "US"
  },
  "areaServed": "United States",
  "serviceType": [
    "Healthcare Analytics",
    "Data Warehouse Consulting",
    "Custom Dashboard Development",
    "Medicare Advantage Analytics",
    "ACO Performance Analytics"
  ]
}
```

### Blog Post Schema (For /blog/[slug] Pages)

```json
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "[Post Title]",
  "description": "[Post Excerpt]",
  "author": {
    "@type": "Organization",
    "name": "Open Flow Insights"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Open Flow Insights",
    "logo": {
      "@type": "ImageObject",
      "url": "https://ofi-healthcare.vercel.app/assets/icons/logo.svg"
    }
  },
  "datePublished": "[Post Date]",
  "dateModified": "[Post Date]",
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://ofi-healthcare.vercel.app/blog/[slug]"
  },
  "articleSection": "[Post Category]",
  "keywords": "[Relevant keywords from post content]"
}
```

---

## Twitter Card Tags (Include on All Pages)

```html
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="[Page Title]" />
<meta name="twitter:description" content="[Page Description]" />
<meta name="twitter:image" content="[OG Image URL]" />
```

---

## Canonical URLs (Must Be Implemented in Next.js Metadata)

Every page should include a canonical URL to avoid duplicate content issues:

```html
<link rel="canonical" href="https://ofi-healthcare.vercel.app[current-path]" />
```

---

## Implementation Notes

1. **Dynamic Blog Posts:** Use Next.js `generateMetadata()` function to pull title, excerpt, date, and category from markdown frontmatter
2. **OG Images:** Placeholder paths provided above. Should be 1200x630px images placed in `/public/assets/og/`
3. **Structured Data:** Inject JSON-LD scripts into Next.js layout or individual page components
4. **Canonical URLs:** Use Next.js metadata API to set canonical URLs dynamically
5. **Sitemap:** Generate dynamically in `/app/sitemap.ts` (see separate file)
