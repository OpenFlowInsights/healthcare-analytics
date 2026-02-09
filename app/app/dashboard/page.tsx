'use client';

import { useQuery } from '@tanstack/react-query';
import { BarChart, Users, DollarSign, TrendingUp } from 'lucide-react';
import Navigation from '@/components/Navigation';

export default function DashboardPage() {
  const { data: summary, isLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: async () => {
      const res = await fetch('/api/snowflake/dashboard-summary');
      const json = await res.json();
      return json.data;
    },
  });

  const { data: rankings } = useQuery({
    queryKey: ['aco-rankings'],
    queryFn: async () => {
      const res = await fetch('/api/snowflake/aco-rankings?limit=10');
      const json = await res.json();
      return json.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Healthcare Analytics Dashboard</h1>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total ACOs</p>
                <p className="text-2xl font-bold">{summary?.TOTAL_ACOS || 0}</p>
              </div>
              <BarChart className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Beneficiaries</p>
                <p className="text-2xl font-bold">
                  {(summary?.TOTAL_BENEFICIARIES || 0).toLocaleString()}
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
                  {(summary?.AVG_SAVINGS_RATE_PCT || 0).toFixed(2)}%
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
                  ${((summary?.TOTAL_SAVINGS_LOSSES || 0) / 1000000).toFixed(1)}M
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-yellow-500" />
            </div>
          </div>
        </div>

        {/* Top ACOs Table */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Top Performing ACOs</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Rank</th>
                  <th className="text-left py-3 px-4">ACO Name</th>
                  <th className="text-left py-3 px-4">State</th>
                  <th className="text-left py-3 px-4">Track</th>
                  <th className="text-right py-3 px-4">Beneficiaries</th>
                  <th className="text-right py-3 px-4">Savings Rate</th>
                  <th className="text-right py-3 px-4">Quality Score</th>
                </tr>
              </thead>
              <tbody>
                {rankings?.map((aco: any, index: number) => (
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
                      {aco.QUALITY_SCORE?.toFixed(1) || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
