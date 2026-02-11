import { DashboardCard } from './DashboardCard';
import type { Dashboard } from '@/lib/constants/dashboards';

interface CategorySectionProps {
  title: string;
  description: string;
  dashboards: Dashboard[];
}

export function CategorySection({ title, description, dashboards }: CategorySectionProps) {
  return (
    <section className="mb-16 last:mb-0">
      <div className="mb-8">
        <h2 className="font-heading font-bold text-2xl sm:text-3xl text-navy-900 mb-2">
          {title}
        </h2>
        <p className="text-gray-600">{description}</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dashboards.map((dashboard) => (
          <DashboardCard key={dashboard.id} dashboard={dashboard} />
        ))}
      </div>
    </section>
  );
}
