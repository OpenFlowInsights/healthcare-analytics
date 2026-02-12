import { getACOProfile, getAIPYears } from '@/lib/data/aip-static';
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
 * Shows detailed ACO profile with spending breakdown and performance metrics (uses static JSON data)
 */
export default function ACOProfilePage({
  params,
  searchParams,
}: ACOProfilePageProps) {
  const acoId = params.id;
  const years = getAIPYears();
  const year = searchParams.year ? Number(searchParams.year) : years[0];

  // Load static ACO profile
  const profile = getACOProfile(acoId, year);

  if (!profile) {
    notFound();
  }

  return <ACOProfileClient profile={profile} years={years} />;
}
