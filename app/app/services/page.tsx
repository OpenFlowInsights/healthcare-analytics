import Navigation from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { CTASection } from '@/components/marketing/CTASection';
import { Database, BarChart3, Activity, Target, Headphones, Clock, DollarSign } from 'lucide-react';

export const metadata = {
  title: 'Healthcare Analytics Services | Custom Dashboards & Data Warehouses | Open Flow Insights',
  description: 'Custom analytics services for healthcare organizations: MSSP dashboards, risk adjustment analytics, quality reporting, data warehouse setup, and ongoing support.',
};

export default function ServicesPage() {
  const services = [
    {
      id: 'data-warehousing',
      icon: Database,
      title: 'Data Integration & Warehousing',
      description: 'Your organization has data everywhere—CMS feeds, EHR exports, claims files, eligibility lists. We build the infrastructure that brings it all together. Modern cloud data warehouses (Snowflake, BigQuery) with automated ingestion, transformation pipelines (dbt), and query optimization.',
      deliverables: [
        'Cloud data warehouse setup & configuration',
        'Automated data ingestion from all source systems',
        'Data transformation layer (staging → clean → metrics)',
        'Documentation & handoff to your analytics team',
      ],
      timeline: '8–12 weeks',
      pricing: 'Custom quote',
    },
    {
      id: 'custom-dashboards',
      icon: BarChart3,
      title: 'Custom Dashboard Development',
      description: 'We don\'t sell you a generic platform. We build exactly the dashboard your team needs—whether that\'s MSSP performance tracking, risk adjustment gap closure, or prior authorization burden analysis. You tell us the question, we build the interface that answers it.',
      deliverables: [
        'Custom dashboard UI (web-based, mobile-responsive)',
        'Real-time data refresh (daily, weekly, or on-demand)',
        'Role-based access controls (executive, analyst, care manager views)',
        'Training & documentation for your team',
      ],
      timeline: '6–8 weeks',
      pricing: 'Starting at $15K',
    },
    {
      id: 'risk-adjustment',
      icon: Activity,
      title: 'Risk Adjustment Analytics',
      description: 'V28 changed everything. We build risk adjustment dashboards that map ICD-10 codes to the current model, prioritize gaps by financial impact, and track provider-level coding performance. You\'ll know which patients need recapture and which codes drive the most revenue.',
      deliverables: [
        'V28-compliant HCC gap analysis',
        'Provider-level RAF scorecards',
        'Patient lists ranked by incremental RAF opportunity',
        'Forecasting tools (revenue impact of closing X gaps)',
      ],
      timeline: '4–6 weeks',
      pricing: 'Starting at $12K',
    },
    {
      id: 'quality-reporting',
      icon: Target,
      title: 'Quality Measure Reporting',
      description: 'HEDIS, MSSP quality gates, Star Ratings—we build dashboards that track all of them. Our quality tools show patient-level gaps, provider performance, and weekly progress. Built for care managers who need action lists, not summary stats.',
      deliverables: [
        'Measure-level performance tracking (current vs. target)',
        'Patient gap lists (filterable by provider, location, reachability)',
        'Outreach tracking (attempted contacts, completed interventions)',
        'Star rating impact forecasting',
      ],
      timeline: '6–8 weeks',
      pricing: 'Starting at $14K',
    },
    {
      id: 'ongoing-support',
      icon: Headphones,
      title: 'Ongoing Analytics Support',
      description: 'Dashboards aren\'t static. CMS changes rules. Your organization changes priorities. We provide ongoing support: measure updates, dashboard enhancements, new data source integrations, and performance optimization.',
      deliverables: [
        'Monthly dashboard updates (new features, bug fixes)',
        'Quarterly measure specification reviews (HEDIS, MSSP, etc.)',
        'Ad-hoc analysis support (answer one-off questions)',
        'On-call support for data pipeline issues',
      ],
      timeline: 'Ongoing',
      pricing: 'Starting at $3K/month',
    },
  ];

  return (
    <>
      <Navigation variant="light" />
      <main className="min-h-screen bg-white">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-navy-900 via-blue-900 to-blue-800 py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="font-heading font-bold text-4xl sm:text-5xl text-white mb-6">
              Analytics Services for Healthcare Organizations
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Custom dashboards, data warehouses, and ongoing analytics support. We build what you need—not what fits our template.
            </p>
          </div>
        </section>

        {/* Services */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="space-y-16">
              {services.map((service, index) => {
                const Icon = service.icon;
                const isEven = index % 2 === 0;

                return (
                  <div
                    key={service.id}
                    id={service.id}
                    className={`flex flex-col ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'} gap-8 items-start scroll-mt-24`}
                  >
                    {/* Icon & Title Column */}
                    <div className="md:w-1/3">
                      <div className="sticky top-24">
                        <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                          <Icon className="h-8 w-8 text-blue-600" />
                        </div>
                        <h2 className="font-heading font-bold text-2xl text-gray-900 mb-2">
                          {service.title}
                        </h2>
                        <div className="flex items-center space-x-4 mt-4">
                          <div className="flex items-center text-sm text-gray-600">
                            <Clock className="h-4 w-4 mr-1" />
                            <span>{service.timeline}</span>
                          </div>
                          {service.pricing && (
                            <div className="flex items-center text-sm text-gray-600">
                              <DollarSign className="h-4 w-4 mr-1" />
                              <span>{service.pricing}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Content Column */}
                    <div className="md:w-2/3">
                      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                        <p className="text-gray-700 mb-6">{service.description}</p>

                        <h3 className="font-heading font-semibold text-lg text-gray-900 mb-3">
                          Key Deliverables
                        </h3>
                        <ul className="space-y-2 mb-6">
                          {service.deliverables.map((deliverable, idx) => (
                            <li key={idx} className="flex items-start text-sm text-gray-600">
                              <span className="text-blue-600 mr-2">•</span>
                              <span>{deliverable}</span>
                            </li>
                          ))}
                        </ul>

                        <button className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm">
                          Request Consultation
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Process Overview */}
        <section className="bg-gray-50 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="font-heading font-bold text-3xl text-gray-900 mb-4">
                How We Work
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                From initial consultation to ongoing support, we focus on delivering value at every stage.
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mb-4">
                  1
                </div>
                <h3 className="font-heading font-semibold text-lg text-gray-900 mb-2">
                  Discovery
                </h3>
                <p className="text-sm text-gray-600">
                  We meet with your team to understand your data sources, current challenges, and desired outcomes. No sales pitch—just listening.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mb-4">
                  2
                </div>
                <h3 className="font-heading font-semibold text-lg text-gray-900 mb-2">
                  Design
                </h3>
                <p className="text-sm text-gray-600">
                  We create mockups, data models, and technical specifications. You approve the design before we write a line of code.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mb-4">
                  3
                </div>
                <h3 className="font-heading font-semibold text-lg text-gray-900 mb-2">
                  Build
                </h3>
                <p className="text-sm text-gray-600">
                  We develop your dashboard or data pipeline, with weekly check-ins to share progress and gather feedback.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mb-4">
                  4
                </div>
                <h3 className="font-heading font-semibold text-lg text-gray-900 mb-2">
                  Launch & Train
                </h3>
                <p className="text-sm text-gray-600">
                  We deploy to production, train your team, document everything, and hand over the keys. You own it.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Philosophy */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-heading font-bold text-3xl text-gray-900 mb-6 text-center">
              Pricing Philosophy
            </h2>
            <div className="bg-blue-50 border-l-4 border-blue-600 p-6">
              <p className="text-gray-700 mb-4">
                We charge project fees for dashboard and data warehouse builds, and monthly retainers for ongoing support. No per-user fees. No data volume surcharges. No surprise bills.
              </p>
              <p className="text-gray-700 mb-4">
                Most dashboard projects range from <strong>$12K–$25K</strong> depending on complexity. Data warehouse projects typically run <strong>$30K–$60K</strong>. Ongoing support starts at <strong>$3K/month</strong>.
              </p>
              <p className="text-gray-700 font-medium">
                Every project starts with a free consultation. We&apos;ll scope the work, estimate the timeline, and provide a fixed quote before you commit.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
