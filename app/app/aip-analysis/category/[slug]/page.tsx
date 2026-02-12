import { getSubcategoryDetail, getAIPYears } from '@/lib/data/aip-static';
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
 * Shows subcategory breakdown for a specific spending category (uses static JSON data)
 */
export default function CategoryDetailPage({
  params,
  searchParams,
}: CategoryDetailPageProps) {
  const category = decodeURIComponent(params.slug);
  const years = getAIPYears();
  const year = searchParams.year ? Number(searchParams.year) : years[0];

  // Load static subcategory data
  const subcategories = getSubcategoryDetail(category, year);

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
