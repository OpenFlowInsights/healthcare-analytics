import { fetchACOProfile, fetchAIPYears } from '@/lib/data/aip';
import { ACOProfileClient } from './ACOProfileClient';
import { notFound } from 'next/navigation';

interface ACOProfilePageProps {
  params: {
    id: string;
  };
  searchParams: {
    year?: string;
  };
}

/**
 * ACO Profile Page - Server Component
 *
 * Shows detailed ACO profile with spending breakdown and performance metrics
 */
export default async function ACOProfilePage({
  params,
  searchParams,
}: ACOProfilePageProps) {
  const acoId = params.id;
  const years = await fetchAIPYears();
  const year = searchParams.year ? Number(searchParams.year) : years[0];

  // Fetch ACO profile
  const profile = await fetchACOProfile(acoId, year);

  if (!profile) {
    notFound();
  }

  return <ACOProfileClient profile={profile} years={years} />;
}
