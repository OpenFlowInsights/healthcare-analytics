import { fetchACODashboardData } from '@/lib/data/aco';
import { ACODashboardClient } from './ACODashboardClient';

/**
 * ACO Performance Dashboard - Server Component
 *
 * This page is statically generated at build time.
 * Data is fetched from Snowflake once during build and baked into static HTML.
 * The page is rebuilt daily at 6 AM UTC via GitHub Actions.
 *
 * Client-side interactivity (sorting, filtering, year selection) uses the pre-fetched data.
 */
export default async function DashboardPage() {
  // Fetch data for all years at build time
  const data = await fetchACODashboardData();

  // Pass multi-year data to client component
  return <ACODashboardClient data={data} />;
}
