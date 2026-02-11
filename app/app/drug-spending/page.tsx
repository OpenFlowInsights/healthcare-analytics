import { fetchDrugSpendingDashboardData } from '@/lib/data/drug-spending';
import { DrugSpendingDashboardClient } from './DrugSpendingDashboardClient';

/**
 * Drug Spending Dashboard - Server Component
 *
 * This page is statically generated at build time.
 * Data is fetched from Snowflake once during build and baked into static HTML.
 * The page is rebuilt daily at 6 AM UTC via GitHub Actions.
 *
 * Client-side interactivity (sorting, filtering, charts) uses the pre-fetched data.
 */
export default async function DrugSpendingPage() {
  // Fetch data at build time (this runs on the server during `next build`)
  const data = await fetchDrugSpendingDashboardData();

  // Pass data to client component
  return <DrugSpendingDashboardClient data={data} />;
}
