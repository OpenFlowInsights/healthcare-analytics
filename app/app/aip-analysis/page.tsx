import { getAIPOverviewData } from '@/lib/data/aip-static';
import { AIPOverviewClient } from './AIPOverviewClient';

/**
 * AIP Analysis Overview - Server Component
 *
 * Shows AIP spending by year, category, and ACO count
 * with drill-down capabilities (uses static JSON data)
 */
export default function AIPAnalysisPage() {
  // Load static data
  const data = getAIPOverviewData();

  return <AIPOverviewClient data={data} />;
}
