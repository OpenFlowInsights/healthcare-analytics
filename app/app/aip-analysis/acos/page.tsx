import { getACOList, getAIPYears } from '@/lib/data/aip-static';
import { ACOListClient } from './ACOListClient';

interface ACOListPageProps {
  searchParams: {
    year?: string;
  };
}

/**
 * ACO List Page - Server Component
 *
 * Shows list of all ACOs with AIP data (uses static JSON data)
 */
export default function ACOListPage({ searchParams }: ACOListPageProps) {
  const years = getAIPYears();
  const year = searchParams.year ? Number(searchParams.year) : years[0];

  // Load static ACO list
  const acos = getACOList(year);

  return <ACOListClient year={year} years={years} acos={acos} />;
}
