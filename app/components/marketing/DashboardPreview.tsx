import Link from 'next/link';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { ArrowRight, BarChart3, Pill, Sparkles } from 'lucide-react';

export function DashboardPreview() {
  const dashboards = [
    {
      title: 'ACO Performance Dashboard',
      description: 'Track shared savings, quality scores, and beneficiary attribution in real-time.',
      href: '/dashboard',
      badge: 'Healthcare ACO',
      icon: BarChart3,
    },
    {
      title: 'Drug Spending Analysis',
      description: 'Analyze medication costs, utilization patterns, and formulary opportunities.',
      href: '/drug-spending',
      badge: 'Healthcare ACO',
      icon: Pill,
    },
    {
      title: 'Part D Prior Authorization Intelligence',
      description: 'Comprehensive PA burden analysis and opportunity identification for Medicare Part D.',
      href: 'https://partd-dashboard.vercel.app',
      badge: 'Part D Analytics',
      icon: Sparkles,
      external: true,
    },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-heading font-bold text-3xl sm:text-4xl text-navy-900 mb-4">
            Explore Our Dashboards
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            See real examples of our analytics in action
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {dashboards.map((dashboard, index) => (
            <Link
              key={index}
              href={dashboard.href}
              target={dashboard.external ? '_blank' : undefined}
              rel={dashboard.external ? 'noopener noreferrer' : undefined}
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
