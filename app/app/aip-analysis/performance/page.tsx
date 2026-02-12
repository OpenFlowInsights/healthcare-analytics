import { getAIPYears } from '@/lib/data/aip-static';
import { PerformanceAnalysisClient } from './PerformanceAnalysisClient';
import acoSpendingData from '@/data/aip/aco_spending.json';

interface PerformancePageProps {
  searchParams: {
    year?: string;
  };
}

/**
 * AIP Performance Analysis Page - Server Component
 *
 * Shows % of AIP spending by category with ACO performance (shared savings rates)
 */
export default function PerformanceAnalysisPage({ searchParams }: PerformancePageProps) {
  const years = getAIPYears();
  const year = searchParams.year ? Number(searchParams.year) : years[0];

  // Get data for selected year, excluding N/A categories
  const yearData = acoSpendingData.filter(
    (d: any) => d.PERFORMANCE_YEAR === year && d.SPENDING_CATEGORY !== 'N/A' && d.TOTAL_ACTUAL_SPENDING !== null
  );

  return <PerformanceAnalysisClient year={year} years={years} data={yearData} />;
}
