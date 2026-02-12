"use client";

import { useState } from 'react';
import Navigation from "@/components/Navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import type { MultiYearDashboardData } from '@/lib/data/aco';
import { PerformanceView } from './PerformanceView';
import { ComparisonView } from './ComparisonView';
import { ParticipantsView } from './ParticipantsView';
import { SNFWaiverView } from './SNFWaiverView';

interface ACODashboardClientProps {
  data: MultiYearDashboardData;
}

type ViewType = 'performance' | 'comparison' | 'participants' | 'snf-waiver';

export function ACODashboardClient({ data }: ACODashboardClientProps) {
  const { years, buildTimestamp } = data;

  // View and year state
  const [activeView, setActiveView] = useState<ViewType>('performance');
  const [selectedYear, setSelectedYear] = useState<number>(years[0] || 2023);
  const [preselectedACOId, setPreselectedACOId] = useState<string | undefined>();

  // Handle ACO click from Performance view
  const handleACOClick = (acoId: string) => {
    setPreselectedACOId(acoId);
    setActiveView('comparison');
  };

  // Format build date
  const buildDate = new Date(buildTimestamp);
  const formattedDate = buildDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });

  const tabs = [
    { id: 'performance' as ViewType, label: 'ACO Performance', description: 'Rankings & KPIs' },
    { id: 'comparison' as ViewType, label: 'ACO Comparison', description: 'Peer Benchmarking' },
    { id: 'participants' as ViewType, label: 'ACO Participants', description: 'Provider Roster' },
    { id: 'snf-waiver' as ViewType, label: 'SNF Waiver Analysis', description: 'Waiver Impact' },
  ];

  return (
    <div>
      <Navigation />
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <Breadcrumbs
            items={[
              { label: 'Dashboards', href: '/dashboards' },
              { label: 'ACO Performance Dashboard' },
            ]}
          />

          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">Healthcare Analytics Dashboard</h1>
              <p className="text-sm text-gray-500 mt-1">MSSP ACO Performance Analysis</p>
            </div>
            <div className="text-sm text-gray-500">
              Data as of: {formattedDate}
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mb-6 border-b border-gray-200">
            <nav className="flex space-x-8" aria-label="Tabs">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveView(tab.id)}
                  className={`
                    py-4 px-1 border-b-2 font-medium text-sm transition-colors
                    ${activeView === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <div className="flex flex-col items-start">
                    <span className="font-semibold">{tab.label}</span>
                    <span className="text-xs text-gray-400">{tab.description}</span>
                  </div>
                </button>
              ))}
            </nav>
          </div>

          {/* View Content */}
          <div className="mt-6">
            {activeView === 'performance' && (
              <PerformanceView
                data={data}
                selectedYear={selectedYear}
                onYearChange={setSelectedYear}
                onACOClick={handleACOClick}
              />
            )}

            {activeView === 'comparison' && (
              <ComparisonView
                data={data}
                selectedYear={selectedYear}
                onYearChange={setSelectedYear}
                preselectedACOId={preselectedACOId}
              />
            )}

            {activeView === 'participants' && (
              <ParticipantsView
                data={data}
                selectedYear={selectedYear}
                onYearChange={setSelectedYear}
              />
            )}

            {activeView === 'snf-waiver' && (
              <SNFWaiverView
                data={data}
                selectedYear={selectedYear}
                onYearChange={setSelectedYear}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
