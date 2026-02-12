import { fetchAIPOverviewData } from '@/lib/data/aip';
import { AIPOverviewClient } from './AIPOverviewClient';

/**
 * AIP Analysis Overview - Server Component
 *
 * Shows AIP spending by year, category, and ACO count
 * with drill-down capabilities
 */
export default async function AIPAnalysisPage() {
  // Fetch data at build time
  const data = await fetchAIPOverviewData();

  return <AIPOverviewClient data={data} />;
}
