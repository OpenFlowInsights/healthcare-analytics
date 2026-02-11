import Link from 'next/link';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { ExternalLink, ArrowRight } from 'lucide-react';
import type { Dashboard } from '@/lib/constants/dashboards';

interface DashboardCardProps {
  dashboard: Dashboard;
}

export function DashboardCard({ dashboard }: DashboardCardProps) {
  const isComingSoon = dashboard.status === 'coming-soon';

  const cardContent = (
    <Card hover={!isComingSoon} className={isComingSoon ? 'opacity-60' : ''}>
      <CardHeader>
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-heading font-semibold text-lg text-navy-900 mb-2">
              {dashboard.title}
              {dashboard.external && (
                <ExternalLink className="inline-block ml-2 h-4 w-4 text-gray-400" />
              )}
            </h3>
          </div>
          {isComingSoon && <Badge variant="warning">Coming Soon</Badge>}
          {!isComingSoon && dashboard.badge && <Badge variant="primary">{dashboard.badge}</Badge>}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 text-sm mb-4">{dashboard.description}</p>
        {!isComingSoon && (
          <div className="flex items-center text-blue-600 font-medium text-sm">
            View Dashboard
            <ArrowRight className="ml-2 h-4 w-4" />
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (isComingSoon || !dashboard.href) {
    return <div className="cursor-not-allowed">{cardContent}</div>;
  }

  return (
    <Link
      href={dashboard.href}
      target={dashboard.external ? '_blank' : undefined}
      rel={dashboard.external ? 'noopener noreferrer' : undefined}
      className="block"
    >
      {cardContent}
    </Link>
  );
}
