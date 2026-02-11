"use client";

import { useState, useMemo } from 'react';
import { BarChart, Users, DollarSign, TrendingUp } from "lucide-react";
import Navigation from "@/components/Navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import type { DashboardSummary, ACORanking } from '@/lib/data/aco';

interface ACODashboardClientProps {
  data: {
    summary: DashboardSummary;
    rankings: ACORanking[];
    buildTimestamp: string;
  };
}

export function ACODashboardClient({ data }: ACODashboardClientProps) {
  const { summary, rankings, buildTimestamp } = data;

  // Client-side state for filtering/sorting
  const [sortColumn, setSortColumn] = useState<string>('SAVINGS_RATE_RANK');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAll, setShowAll] = useState(false);

  // Client-side filtering and sorting
  const filteredAndSortedRankings = useMemo(() => {
    let filtered = rankings;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(aco =>
        aco.ACO_NAME.toLowerCase().includes(searchTerm.toLowerCase()) ||
        aco.ACO_STATE.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      const aVal = a[sortColumn as keyof ACORanking];
      const bVal = b[sortColumn as keyof ACORanking];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      const numA = Number(aVal);
      const numB = Number(bVal);
      return sortDirection === 'asc' ? numA - numB : numB - numA;
    });

    return sorted;
  }, [rankings, searchTerm, sortColumn, sortDirection]);

  // Pagination
  const displayedRankings = showAll ? filteredAndSortedRankings : filteredAndSortedRankings.slice(0, 20);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
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
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold">Healthcare Analytics Dashboard</h1>
            <div className="text-sm text-gray-500">
              Data as of: {formattedDate}
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total ACOs</p>
                  <p className="text-2xl font-bold">{summary.TOTAL_ACOS || 0}</p>
                </div>
                <BarChart className="h-8 w-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Beneficiaries</p>
                  <p className="text-2xl font-bold">
                    {(summary.TOTAL_BENEFICIARIES || 0).toLocaleString()}
                  </p>
                </div>
                <Users className="h-8 w-8 text-green-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Savings Rate</p>
                  <p className="text-2xl font-bold">
                    {(summary.AVG_SAVINGS_RATE_PCT || 0).toFixed(2)}%
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Savings</p>
                  <p className="text-2xl font-bold">
                    ${((summary.TOTAL_SAVINGS_LOSSES || 0) / 1000000).toFixed(1)}M
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-yellow-500" />
              </div>
            </div>
          </div>

          {/* Top ACOs Table */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Top Performing ACOs</h2>
              <input
                type="text"
                placeholder="Search ACOs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Rank</th>
                    <th
                      className="text-left py-3 px-4 cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('ACO_NAME')}
                    >
                      ACO Name {sortColumn === 'ACO_NAME' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      className="text-left py-3 px-4 cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('ACO_STATE')}
                    >
                      State {sortColumn === 'ACO_STATE' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="text-left py-3 px-4">Track</th>
                    <th
                      className="text-right py-3 px-4 cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('TOTAL_BENEFICIARIES')}
                    >
                      Beneficiaries {sortColumn === 'TOTAL_BENEFICIARIES' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      className="text-right py-3 px-4 cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('SAVINGS_RATE_PCT')}
                    >
                      Savings Rate {sortColumn === 'SAVINGS_RATE_PCT' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      className="text-right py-3 px-4 cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('QUALITY_SCORE')}
                    >
                      Quality Score {sortColumn === 'QUALITY_SCORE' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {displayedRankings.map((aco, index) => (
                    <tr key={aco.ACO_ID} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">{index + 1}</td>
                      <td className="py-3 px-4">{aco.ACO_NAME}</td>
                      <td className="py-3 px-4">{aco.ACO_STATE}</td>
                      <td className="py-3 px-4">{aco.ACO_TRACK}</td>
                      <td className="py-3 px-4 text-right">
                        {aco.TOTAL_BENEFICIARIES?.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {aco.SAVINGS_RATE_PCT?.toFixed(2)}%
                      </td>
                      <td className="py-3 px-4 text-right">
                        {aco.QUALITY_SCORE?.toFixed(1) || "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredAndSortedRankings.length > 20 && (
              <div className="mt-4 text-center">
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {showAll ? 'Show Top 20' : `Show All ${filteredAndSortedRankings.length} ACOs`}
                </button>
              </div>
            )}

            {searchTerm && filteredAndSortedRankings.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No ACOs found matching &quot;{searchTerm}&quot;
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
