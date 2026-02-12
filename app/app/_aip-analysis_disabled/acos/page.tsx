import { fetchACOList, fetchAIPYears } from '@/lib/data/aip';
import { ACOListClient } from './ACOListClient';

interface ACOListPageProps {
  searchParams: {
    year?: string;
  };
}

/**
 * ACO List Page - Server Component
 *
 * Shows list of all ACOs with AIP data
 */
export default async function ACOListPage({ searchParams }: ACOListPageProps) {
  const years = await fetchAIPYears();
  const year = searchParams.year ? Number(searchParams.year) : years[0];

  // Fetch ACO list
  const acos = await fetchACOList(year);

  return <ACOListClient year={year} years={years} acos={acos} />;
}
