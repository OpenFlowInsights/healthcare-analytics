import Navigation from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { CTASection } from '@/components/marketing/CTASection';
import { Database, BarChart3, Users, Headphones, Shield, CheckCircle } from 'lucide-react';

export const metadata = {
  title: 'About Open Flow Insights | Healthcare Analytics Consulting',
  description: 'Open Flow Insights builds custom analytics dashboards and data infrastructure for ACOs, Medicare Advantage plans, and value-based care organizations.',
};

export default function AboutPage() {
  return (
    <>
      <Navigation variant="light" />
      <main className="min-h-screen bg-white">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-navy-900 via-blue-900 to-blue-800 py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="font-heading font-bold text-4xl sm:text-5xl text-white mb-6">
              We Build the Analytics Infrastructure Healthcare Organizations Wish They Had
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Custom dashboards, data warehouses, and analytics consulting for ACOs, Medicare Advantage plans, and value-based care organizations.
            </p>
          </div>
        </section>

        {/* Company Overview */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-heading font-bold text-3xl text-gray-900 mb-6">
              Company Overview
            </h2>
            <div className="prose prose-lg max-w-none text-gray-700">
              <p>
                Open Flow Insights provides analytics consulting and custom dashboard development for healthcare organizations. We work with MSSP ACOs, Medicare Advantage plans, and health systems that are drowning in data but starving for insight.
              </p>
              <p>
                We don&apos;t sell a platform. We don&apos;t have a &quot;one size fits all&quot; solution. We build the analytics infrastructure your organization actually needs—whether that&apos;s a shared savings forecasting tool, a risk adjustment gap dashboard, or a full data warehouse architecture.
              </p>
              <p>
                Our clients range from 5,000-member ACOs to 100,000+ member MA plans. What they have in common: they tried to build this in-house, realized it&apos;s harder than it looks, and called us.
              </p>
            </div>
          </div>
        </section>

        {/* Our Approach */}
        <section className="bg-gray-50 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="font-heading font-bold text-3xl text-gray-900 mb-4">
                Our Approach
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                We start with the question, not the tool. From there, we build custom analytics infrastructure tailored to your organization.
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-8">
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Database className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-heading font-semibold text-lg text-gray-900 mb-2">
                  Data Integration
                </h3>
                <p className="text-sm text-gray-600">
                  Connect your CMS feeds, EHR exports, claims files, and eligibility lists into a unified data warehouse.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-heading font-semibold text-lg text-gray-900 mb-2">
                  Warehousing
                </h3>
                <p className="text-sm text-gray-600">
                  Modern cloud data warehouses (Snowflake, BigQuery) with automated transformation pipelines.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-heading font-semibold text-lg text-gray-900 mb-2">
                  Dashboards
                </h3>
                <p className="text-sm text-gray-600">
                  Custom dashboards designed for your team—not generic templates that require workarounds.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Headphones className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-heading font-semibold text-lg text-gray-900 mb-2">
                  Support
                </h3>
                <p className="text-sm text-gray-600">
                  Ongoing updates, measure changes, new data sources—we adapt as your needs evolve.
                </p>
              </div>
            </div>

            <div className="mt-12 max-w-3xl mx-auto">
              <div className="bg-blue-50 border-l-4 border-blue-600 p-6">
                <p className="text-gray-700 font-medium">
                  We train your team, then hand it off. Our goal isn&apos;t to keep you dependent on us. We build tools your team can maintain, we document everything, and we train your staff to run it.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Who We Serve */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="font-heading font-bold text-3xl text-gray-900 mb-4">
                Who We Serve
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                We work with healthcare organizations taking financial risk and needing data to manage it.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="font-heading font-semibold text-lg text-gray-900 mb-3">
                  MSSP ACOs
                </h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                    <span>Shared savings forecasting</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                    <span>Attribution tracking</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                    <span>Benchmark analysis</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="font-heading font-semibold text-lg text-gray-900 mb-3">
                  Medicare Advantage Plans
                </h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                    <span>Risk adjustment & RAF optimization</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                    <span>Star Ratings dashboards</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                    <span>Quality gap closure tracking</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="font-heading font-semibold text-lg text-gray-900 mb-3">
                  Health Systems
                </h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                    <span>Population health analytics</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                    <span>Network utilization analysis</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                    <span>Cost management dashboards</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="font-heading font-semibold text-lg text-gray-900 mb-3">
                  Value-Based Care Organizations
                </h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                    <span>Quality measure tracking</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                    <span>Financial performance forecasting</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                    <span>Care management workflow tools</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="font-heading font-semibold text-lg text-gray-900 mb-3">
                  Aesthetics Practices
                </h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                    <span>Revenue tracking & forecasting</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                    <span>Treatment package analytics</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                    <span>Customer retention dashboards</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="font-heading font-semibold text-lg text-gray-900 mb-3">
                  Small Businesses
                </h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                    <span>Custom operational dashboards</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                    <span>Data integration & automation</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                    <span>Business intelligence setup</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Compliance Badges */}
        <section className="bg-gray-50 py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h2 className="font-heading font-bold text-2xl text-gray-900 mb-2">
                Security & Compliance
              </h2>
              <p className="text-gray-600">
                We take data security seriously. Our infrastructure and processes are designed to meet healthcare compliance standards.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg border border-gray-200 text-center">
                <Shield className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                <h3 className="font-heading font-semibold text-lg text-gray-900 mb-1">
                  HIPAA Compliant
                </h3>
                <p className="text-sm text-gray-600">
                  Infrastructure designed for PHI handling
                </p>
                <p className="text-xs text-gray-500 mt-2">(In Progress)</p>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200 text-center">
                <Shield className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                <h3 className="font-heading font-semibold text-lg text-gray-900 mb-1">
                  SOC 2
                </h3>
                <p className="text-sm text-gray-600">
                  Security and availability controls
                </p>
                <p className="text-xs text-gray-500 mt-2">(Planned)</p>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200 text-center">
                <Shield className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                <h3 className="font-heading font-semibold text-lg text-gray-900 mb-1">
                  HITRUST
                </h3>
                <p className="text-sm text-gray-600">
                  Healthcare information trust framework
                </p>
                <p className="text-xs text-gray-500 mt-2">(Planned)</p>
              </div>
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
