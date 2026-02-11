import Navigation from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { CategorySection } from '@/components/dashboards/CategorySection';
import { dashboards, categories } from '@/lib/constants/dashboards';

export default function DashboardsPage() {
  return (
    <>
      <Navigation variant="light" />
      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="bg-gradient-navy-blue py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="font-heading font-bold text-4xl sm:text-5xl text-white mb-4">
                Dashboard Showcase
              </h1>
              <p className="text-xl text-gray-200 max-w-3xl mx-auto">
                Explore our comprehensive suite of healthcare analytics dashboards. From ACO performance tracking to Part D intelligence, we have the insights you need.
              </p>
            </div>
          </div>
        </section>

        {/* Dashboard Categories */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {categories.map((category) => {
              const categoryDashboards = dashboards.filter(
                (d) => d.category === category.id
              );
              return (
                <CategorySection
                  key={category.id}
                  title={category.name}
                  description={category.description}
                  dashboards={categoryDashboards}
                />
              );
            })}
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-white py-16 border-t">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="font-heading font-bold text-3xl text-navy-900 mb-4">
              Need a Custom Dashboard?
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              We build bespoke analytics solutions tailored to your organization&apos;s unique needs and data sources.
            </p>
            <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg">
              Schedule a Consultation
            </button>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
