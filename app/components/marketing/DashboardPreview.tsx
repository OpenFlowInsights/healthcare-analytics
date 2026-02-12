import Link from 'next/link';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { ArrowRight, BarChart3, Pill, AlertTriangle } from 'lucide-react';

export function DashboardPreview() {
  const dashboards = [
    {
      title: 'ACO Performance Dashboard',
      description: 'Track shared savings, RAF scores, quality measures, and provider-level cost patterns',
      href: 'https://ofi-healthcare.vercel.app/dashboard',
      badge: 'Healthcare ACO',
      icon: BarChart3,
    },
    {
      title: 'PA Gap Analysis',
      description: 'Flag claims with no PA where national plans require it, quantify spend exposure',
      href: 'https://partd-dashboard.vercel.app/dashboard/pa-opportunity',
      badge: 'Part D Intelligence',
      icon: AlertTriangle,
    },
    {
      title: 'Drug Spending Analysis',
      description: 'Medicare Part D spending trends, brand vs generic analysis, cost-per-beneficiary tracking',
      href: 'https://ofi-healthcare.vercel.app/drug-spending',
      badge: 'Healthcare ACO',
      icon: Pill,
    },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Banner */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full border border-blue-200">
            <span className="text-sm font-medium text-blue-900">
              All dashboards below are live with real CMS data
            </span>
            <span className="text-blue-600 animate-pulse">→</span>
          </div>
        </div>

        <div className="text-center mb-12">
          <h2 className="font-heading font-bold text-3xl sm:text-4xl text-navy-900 mb-4">
            See What Your Data Looks Like
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Explore live dashboards powered by real CMS data
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {dashboards.map((dashboard, index) => (
            <Link
              key={index}
              href={dashboard.href}
              target="_blank"
              rel="noopener noreferrer"
              className="block animate-fadeInUp"
              style={{ animationDelay: `${index * 200}ms` }}
            >
              <Card hover className="h-full">
                <CardHeader>
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-lg bg-blue-50 text-blue-600`}>
                      <dashboard.icon className="h-6 w-6" />
                    </div>
                    <Badge variant="primary">{dashboard.badge}</Badge>
                  </div>
                  <h3 className="font-heading font-semibold text-xl text-navy-900 mb-2">
                    {dashboard.title}
                  </h3>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">{dashboard.description}</p>
                  <div className="flex items-center text-blue-600 font-medium text-sm">
                    View Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            href="/dashboards"
            className="inline-flex items-center text-blue-600 font-semibold hover:text-blue-700 transition-colors"
          >
            View All Dashboards
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
