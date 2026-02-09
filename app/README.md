# Healthcare Analytics Dashboard

Next.js 14 application for visualizing CMS MSSP ACO performance data and BCDA FHIR data from Snowflake.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Data Fetching:** @tanstack/react-query
- **Database:** Snowflake (via snowflake-sdk)
- **Authentication:** NextAuth.js
- **Charts:** Recharts
- **Icons:** Lucide React

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `.env.local`

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

- `app/api/snowflake/` - API routes for Snowflake queries
- `app/dashboard/` - Dashboard page
- `lib/snowflake.ts` - Snowflake connection utilities
- `.env.local` - Environment configuration

## Features

- Landing page with platform overview
- Dashboard with KPIs and ACO rankings
- Snowflake integration with mart tables
- React Query for efficient data fetching
- NextAuth.js authentication (placeholder)
