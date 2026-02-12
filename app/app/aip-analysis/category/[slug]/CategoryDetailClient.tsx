"use client";

import { useState } from 'react';
import Navigation from "@/components/Navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { SubcategoryDetail } from '@/lib/data/aip';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface CategoryDetailClientProps {
  category: string;
  year: number;
  years: number[];
  subcategories: SubcategoryDetail[];
}

export function CategoryDetailClient({
  category,
  year,
  years,
  subcategories,
}: CategoryDetailClientProps) {
  const router = useRouter();
  const [selectedYear, setSelectedYear] = useState(year);

  const handleYearChange = (newYear: number) => {
    setSelectedYear(newYear);
    router.push(`/aip-analysis/category/${encodeURIComponent(category)}?year=${newYear}`);
  };

  // Calculate totals
  const totalActual = subcategories.reduce((sum, sub) => sum + (sub.TOTAL_ACTUAL_SPENDING || 0), 0);
  const totalProjected = subcategories.reduce((sum, sub) => sum + (sub.TOTAL_PROJECTED_SPENDING || 0), 0);
  const totalACOs = new Set(subcategories.flatMap(() => [])).size;
  const uniqueACOs = subcategories.reduce((sum, sub) => sum + sub.NUM_ACOS, 0) / subcategories.length;

  // Prepare chart data
  const chartData = subcategories.map(sub => ({
    name: sub.SPENDING_SUBCATEGORY.length > 25
      ? sub.SPENDING_SUBCATEGORY.substring(0, 25) + '...'
      : sub.SPENDING_SUBCATEGORY,
    fullName: sub.SPENDING_SUBCATEGORY,
    'Actual Spending': sub.TOTAL_ACTUAL_SPENDING || 0,
    'Projected Spending': sub.TOTAL_PROJECTED_SPENDING || 0,
    'ACOs': sub.NUM_ACOS,
  }));

  return (
    <div>
      <Navigation />
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <Breadcrumbs
            items={[
              { label: 'Dashboards', href: '/dashboards' },
              { label: 'AIP Analysis', href: '/aip-analysis' },
              { label: category },
            ]}
          />

          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">{category}</h1>
              <p className="text-sm text-gray-500 mt-1">Subcategory Spending Breakdown</p>
            </div>
          </div>

          {/* Year Selector */}
          <div className="mb-6 flex items-center space-x-4">
            <label className="font-medium text-gray-700">Performance Year:</label>
            <select
              value={selectedYear}
              onChange={(e) => handleYearChange(Number(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-500">Subcategories</div>
              <div className="mt-2 text-3xl font-bold text-gray-900">
                {subcategories.length}
              </div>
              <div className="mt-2 text-xs text-gray-500">
                in this category
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-500">Total ACOs</div>
              <div className="mt-2 text-3xl font-bold text-gray-900">
                {Math.round(uniqueACOs)}
              </div>
              <div className="mt-2 text-xs text-gray-500">
                using this category
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-500">
                {selectedYear === 2024 ? 'Total Actual' : 'Total Projected'}
              </div>
              <div className="mt-2 text-3xl font-bold text-blue-600">
                ${((selectedYear === 2024 ? totalActual : totalProjected) / 1000000).toFixed(2)}M
              </div>
              <div className="mt-2 text-xs text-gray-500">
                category total
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-500">Avg per ACO</div>
              <div className="mt-2 text-3xl font-bold text-purple-600">
                ${((selectedYear === 2024 ? totalActual : totalProjected) / (uniqueACOs || 1) / 1000).toFixed(0)}K
              </div>
              <div className="mt-2 text-xs text-gray-500">
                average spending
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">Spending by Subcategory</h2>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={200}
                />
                <Tooltip
                  formatter={(value) => [`$${(value || 0).toLocaleString()}`, '']}

                  labelFormatter={(label: string) => {
                    const item = chartData.find(d => d.name === label);
                    return item?.fullName || label;
                  }}
                />
                <Legend />
                <Bar
                  dataKey={selectedYear === 2024 ? "Actual Spending" : "Projected Spending"}
                  fill="#2563eb"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Subcategory Details Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold">Subcategory Details</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subcategory
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ACOs
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {selectedYear === 2024 ? 'Actual Spending' : 'Projected Spending'}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg per ACO
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg Savings Rate
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Performance
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {subcategories.map((sub, index) => {
                    const spending = selectedYear === 2024 ? sub.TOTAL_ACTUAL_SPENDING : sub.TOTAL_PROJECTED_SPENDING;
                    const avgPerACO = selectedYear === 2024 ? sub.AVG_ACTUAL_PER_ACO : sub.AVG_PROJECTED_PER_ACO;

                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{sub.SPENDING_SUBCATEGORY}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                          {sub.NUM_ACOS}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                          ${spending?.toLocaleString() || '0'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                          ${avgPerACO?.toLocaleString() || '0'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                          {sub.AVG_SAVINGS_RATE?.toFixed(2)}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-green-600 text-xs">
                              ✓ {sub.ACOS_WITH_EARNINGS} earned
                            </span>
                            <span className="text-red-600 text-xs">
                              ✗ {sub.ACOS_WITH_LOSSES} losses
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Back Link */}
          <div className="mt-8">
            <Link
              href="/aip-analysis"
              className="text-blue-600 hover:text-blue-900 font-medium"
            >
              ← Back to AIP Overview
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
