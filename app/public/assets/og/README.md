# Open Graph Images Directory

This directory contains Open Graph images for social media sharing (Twitter, LinkedIn, Facebook, Slack previews).

## Required OG Images

All images must be **1200x630px** (standard OG image size).

### Site Pages
- **homepage.png** (1200x630px)
  - OFI logo + "Turn Healthcare Data Into Confident Decisions"
  - Navy → blue gradient background
  - Clean, bold typography

- **dashboards.png** (1200x630px)
  - "Healthcare Analytics Dashboards"
  - Mini dashboard preview or iconography
  - OFI branding

- **blog.png** (1200x630px)
  - "Healthcare Analytics Blog | Open Flow Insights"
  - Book/article iconography
  - OFI branding

- **data-tools.png** (1200x630px)
  - "SnowQuery | Natural Language SQL"
  - Database/query iconography
  - OFI branding

- **drug-spending.png** (1200x630px)
  - "Medicare Part D Drug Spending Dashboard"
  - Chart iconography
  - OFI branding

- **default.png** (1200x630px)
  - Fallback for any page without a specific OG image
  - Just OFI logo + tagline
  - Navy background

### Blog Posts
- **blog-default.png** (1200x630px)
  - Generic blog post OG image
  - "Open Flow Insights Blog"
  - Can be customized per post later

## Design Guidelines

**Layout:**
```
┌─────────────────────────────────────────────┐
│                                             │
│           [Logo/Icon - Top Left]            │
│                                             │
│        [Headline - Large, Bold]             │
│        [Subheading - Smaller]               │
│                                             │
│           openflowinsights.com              │
│                                             │
└─────────────────────────────────────────────┘
```

**Typography:**
- Heading: Plus Jakarta Sans, 700 weight, 60-72px
- Subheading: Inter, 400 weight, 32-40px
- URL: Inter, 400 weight, 24px

**Colors:**
- Background: Navy → Blue gradient (or solid navy)
- Text: White or off-white (#F8FAFC)
- Accent: Blue-bright or teal for icons/highlights

**Branding:**
- Always include OFI logo or wordmark
- Always include domain (openflowinsights.com or ofi-healthcare.vercel.app)

## Tools for Creating OG Images

**Option 1: Figma**
- Use Figma template (1200x630px artboard)
- Export as PNG at 2x resolution
- Upload to `/public/assets/og/`

**Option 2: Code-Based (Vercel OG)**
- Use `@vercel/og` package to generate OG images dynamically
- See Next.js docs: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image

**Option 3: Canva**
- Use Canva's "Open Graph" template size
- Follow OFI brand guidelines
- Export as PNG

## Testing

Test OG images using:
- Twitter Card Validator: https://cards-dev.twitter.com/validator
- LinkedIn Post Inspector: https://www.linkedin.com/post-inspector/
- Facebook Sharing Debugger: https://developers.facebook.com/tools/debug/
- Slack: Paste URL in a Slack message to preview

## Current Status
- [ ] homepage.png
- [ ] dashboards.png
- [ ] blog.png
- [ ] data-tools.png
- [ ] drug-spending.png
- [ ] default.png
- [ ] blog-default.png

## Placeholder

Until real OG images are created, use the default OG image with OFI logo and tagline.
