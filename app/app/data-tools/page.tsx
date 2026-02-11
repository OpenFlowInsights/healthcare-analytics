import Navigation from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Database, Sparkles, Shield, Zap, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function DataToolsPage() {
  const snowqueryUrl = 'https://snowquery.vercel.app';

  const features = [
    {
      icon: Sparkles,
      title: 'Natural Language Queries',
      description: 'Ask questions in plain English and get instant SQL results',
    },
    {
      icon: Database,
      title: 'Direct Snowflake Access',
      description: 'Query your data warehouse without writing SQL',
    },
    {
      icon: Shield,
      title: 'Secure & Multi-Tenant',
      description: 'Role-based access with tenant isolation',
    },
    {
      icon: Zap,
      title: 'AI-Powered',
      description: 'Claude AI translates your questions into optimized SQL',
    },
  ];

  return (
    <>
      <Navigation variant="light" />
      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="bg-gradient-navy-blue py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 rounded-2xl mb-6">
                <Database className="w-10 h-10 text-white" />
              </div>
              <div className="flex items-center justify-center gap-3 mb-4">
                <h1 className="font-heading font-bold text-4xl sm:text-5xl text-white">
                  SnowQuery
                </h1>
                <span className="bg-white/20 text-white text-sm font-bold px-3 py-1 rounded-full">
                  BETA
                </span>
              </div>
              <p className="text-xl text-gray-200 max-w-3xl mx-auto mb-8">
                Self-service natural language query interface for your Snowflake data warehouse.
                Ask questions in plain English and get instant insights.
              </p>
              <a
                href={snowqueryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors shadow-md hover:shadow-lg"
              >
                Launch SnowQuery
                <ExternalLink className="w-5 h-5" />
              </a>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="font-heading font-bold text-3xl text-navy-900 mb-4">
                Powerful Features
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                SnowQuery makes data exploration accessible to everyone in your organization
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <Card key={feature.title}>
                    <CardContent className="pt-6">
                      <div className="flex flex-col items-center text-center">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                          <Icon className="w-6 h-6 text-blue-600" />
                        </div>
                        <h3 className="font-semibold text-lg text-navy-900 mb-2">
                          {feature.title}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {feature.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="font-heading font-bold text-3xl text-navy-900 mb-4">
                How It Works
              </h2>
            </div>

            <div className="space-y-8">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-navy-900 mb-2">
                    Ask Your Question
                  </h3>
                  <p className="text-gray-600">
                    Type your question in plain English, like &quot;What were our top 10 highest cost claims last month?&quot;
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-navy-900 mb-2">
                    AI Generates SQL
                  </h3>
                  <p className="text-gray-600">
                    Claude AI understands your question and generates optimized SQL that queries your Snowflake database
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-navy-900 mb-2">
                    Get Results Instantly
                  </h3>
                  <p className="text-gray-600">
                    View your results in a sortable table, see the SQL that was generated, and export to CSV for further analysis
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-navy-blue">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="font-heading font-bold text-3xl text-white mb-4">
              Ready to Explore Your Data?
            </h2>
            <p className="text-lg text-gray-200 mb-8">
              Access SnowQuery now and start querying your data warehouse with natural language
            </p>
            <a
              href={snowqueryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors shadow-md hover:shadow-lg"
            >
              Launch SnowQuery
              <ExternalLink className="w-5 h-5" />
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
