import { fetchSubcategoryDetail, fetchAIPYears } from '@/lib/data/aip';
import { CategoryDetailClient } from './CategoryDetailClient';
import { notFound } from 'next/navigation';

interface CategoryDetailPageProps {
  params: {
    slug: string;
  };
  searchParams: {
    year?: string;
  };
}

/**
 * Category Detail Page - Server Component
 *
 * Shows subcategory breakdown for a specific spending category
 */
export default async function CategoryDetailPage({
  params,
  searchParams,
}: CategoryDetailPageProps) {
  const category = decodeURIComponent(params.slug);
  const years = await fetchAIPYears();
  const year = searchParams.year ? Number(searchParams.year) : years[0];

  // Fetch subcategory data
  const subcategories = await fetchSubcategoryDetail(category, year);

  if (subcategories.length === 0) {
    notFound();
  }

  return (
    <CategoryDetailClient
      category={category}
      year={year}
      years={years}
      subcategories={subcategories}
    />
  );
}
