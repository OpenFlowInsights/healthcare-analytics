"use client";

import { useState } from 'react';
import Navigation from "@/components/Navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import Link from 'next/link';
import type { AIPOverviewData } from '@/lib/data/aip';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface AIPOverviewClientProps {
  data: AIPOverviewData;
}

const COLORS = ['#2563eb', '#7c3aed', '#db2777', '#ea580c', '#ca8a04', '#65a30d'];

export function AIPOverviewClient({ data }: AIPOverviewClientProps) {
  const { years, yearSummaries, categoriesByYear, buildTimestamp } = data;
  const [selectedYear, setSelectedYear] = useState<number>(years[0] || 2024);

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

  const currentYearSummary = yearSummaries.find(y => y.PERFORMANCE_YEAR === selectedYear);
  const currentCategories = categoriesByYear[selectedYear] || [];

  // Prepare chart data
  const categoryChartData = currentCategories.map(cat => ({
    name: cat.SPENDING_CATEGORY,
    'Actual Spending': cat.TOTAL_ACTUAL_SPENDING || 0,
    'Projected Spending': cat.TOTAL_PROJECTED_SPENDING || 0,
    'ACOs': cat.NUM_ACOS,
  }));

  const pieChartData = currentCategories.map(cat => ({
    name: cat.SPENDING_CATEGORY,
    value: cat.TOTAL_ACTUAL_SPENDING || cat.TOTAL_PROJECTED_SPENDING || 0,
  }));

  // Year comparison data
  const yearComparisonData = yearSummaries.map(ys => ({
    year: ys.PERFORMANCE_YEAR,
    'Actual Spending': ys.TOTAL_ACTUAL_SPENDING || 0,
    'Projected Spending': ys.TOTAL_PROJECTED_SPENDING || 0,
    'ACOs': ys.TOTAL_ACOS,
  }));

  return (
    <div>
      <Navigation />
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <Breadcrumbs
            items={[
              { label: 'Dashboards', href: '/dashboards' },
              { label: 'AIP Analysis' },
            ]}
          />

          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">AIP Spending Analysis</h1>
              <p className="text-sm text-gray-500 mt-1">Advance Investment Payment Analysis by Category & ACO</p>
            </div>
            <div className="text-sm text-gray-500">
              Data as of: {formattedDate}
            </div>
          </div>

          {/* Year Selector */}
          <div className="mb-6 flex items-center space-x-4">
            <label className="font-medium text-gray-700">Performance Year:</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          {/* Summary Cards */}
          {currentYearSummary && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-sm font-medium text-gray-500">Total ACOs</div>
                <div className="mt-2 text-3xl font-bold text-gray-900">
                  {currentYearSummary.TOTAL_ACOS}
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  with AIP data
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-sm font-medium text-gray-500">Total Categories</div>
                <div className="mt-2 text-3xl font-bold text-gray-900">
                  {currentYearSummary.TOTAL_CATEGORIES}
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  spending categories
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-sm font-medium text-gray-500">
                  {selectedYear === 2024 ? 'Actual Spending' : 'Projected Spending'}
                </div>
                <div className="mt-2 text-3xl font-bold text-blue-600">
                  ${((selectedYear === 2024 ? currentYearSummary.TOTAL_ACTUAL_SPENDING : currentYearSummary.TOTAL_PROJECTED_SPENDING) / 1000000).toFixed(1)}M
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  total investment
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-sm font-medium text-gray-500">Avg per ACO</div>
                <div className="mt-2 text-3xl font-bold text-purple-600">
                  ${((selectedYear === 2024 ? currentYearSummary.AVG_SPENDING_PER_ACO_ACTUAL : currentYearSummary.AVG_SPENDING_PER_ACO_PROJECTED) / 1000).toFixed(0)}K
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  average investment
                </div>
              </div>
            </div>
          )}

          {/* Year-over-Year Comparison Chart */}
          {years.length > 1 && (
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h2 className="text-xl font-bold mb-4">Year-over-Year Spending</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={yearComparisonData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis
                    tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
                  />
                  <Tooltip
                    formatter={(value) => [`$${(value || 0).toLocaleString()}`, '']}
                  />
                  <Legend />
                  <Bar dataKey="Actual Spending" fill="#2563eb" />
                  <Bar dataKey="Projected Spending" fill="#7c3aed" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Category Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Bar Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Spending by Category</h2>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={categoryChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-15} textAnchor="end" height={100} />
                  <YAxis
                    tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
                  />
                  <Tooltip
                    formatter={(value) => [`$${(value || 0).toLocaleString()}`, '']}
                  />
                  <Legend />
                  <Bar dataKey={selectedYear === 2024 ? "Actual Spending" : "Projected Spending"} fill="#2563eb" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Pie Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Category Distribution</h2>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${((entry.value / pieChartData.reduce((sum, e) => sum + e.value, 0)) * 100).toFixed(1)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `$${(value || 0).toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Details Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold">Category Details</h2>
              <p className="text-sm text-gray-500 mt-1">Click a category to see subcategory breakdown</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ACOs
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subcategories
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {selectedYear === 2024 ? 'Actual Spending' : 'Projected Spending'}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      % of Total
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentCategories.map((category, index) => {
                    const spending = selectedYear === 2024
                      ? category.TOTAL_ACTUAL_SPENDING
                      : category.TOTAL_PROJECTED_SPENDING;
                    const pct = selectedYear === 2024
                      ? category.PCT_OF_YEAR_ACTUAL
                      : category.PCT_OF_YEAR_PROJECTED;

                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{category.SPENDING_CATEGORY}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                          {category.NUM_ACOS}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                          {category.NUM_SUBCATEGORIES}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                          ${spending?.toLocaleString() || '0'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                          {pct?.toFixed(1)}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <Link
                            href={`/aip-analysis/category/${encodeURIComponent(category.SPENDING_CATEGORY)}?year=${selectedYear}`}
                            className="text-blue-600 hover:text-blue-900 font-medium"
                          >
                            View Details →
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ACO List Link */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-blue-900">View Individual ACO Profiles</h3>
                <p className="text-sm text-blue-700 mt-1">
                  See detailed spending breakdown and performance metrics for specific ACOs
                </p>
              </div>
              <Link
                href={`/aip-analysis/acos?year=${selectedYear}`}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Browse ACOs
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
