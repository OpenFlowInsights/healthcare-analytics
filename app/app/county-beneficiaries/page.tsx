import { fetchCountyBeneficiaryData } from '@/lib/data/aco';
import { CountyBeneficiaryView } from './CountyBeneficiaryView';
import Navigation from "@/components/Navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";

// Use dynamic rendering due to large dataset (500K+ rows)
export const dynamic = 'force-dynamic';

export default async function CountyBeneficiariesPage() {
  const data = await fetchCountyBeneficiaryData();

  return (
    <div>
      <Navigation />
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <Breadcrumbs
            items={[
              { label: 'Dashboards', href: '/dashboards' },
              { label: 'County Beneficiaries' },
            ]}
          />

          <CountyBeneficiaryView data={data} />
        </div>
      </div>
    </div>
  );
}
