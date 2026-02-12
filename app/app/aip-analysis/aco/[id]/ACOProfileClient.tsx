"use client";

import { useState } from 'react';
import Navigation from "@/components/Navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ACOProfile } from '@/lib/data/aip';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface ACOProfileClientProps {
  profile: ACOProfile;
  years: number[];
}

const COLORS = ['#2563eb', '#7c3aed', '#db2777', '#ea580c', '#ca8a04', '#65a30d'];

export function ACOProfileClient({ profile, years }: ACOProfileClientProps) {
  const router = useRouter();
  const [selectedYear, setSelectedYear] = useState(profile.PERFORMANCE_YEAR);

  const handleYearChange = (newYear: number) => {
    setSelectedYear(newYear);
    router.push(`/aip-analysis/aco/${profile.ACO_ID}?year=${newYear}`);
  };

  // Prepare chart data
  const categoryChartData = profile.categories.map(cat => ({
    name: cat.category,
    value: cat.actual_spending || cat.projected_spending,
  }));

  const isActualData = profile.PERFORMANCE_YEAR === 2024;
  const totalSpending = isActualData ? profile.TOTAL_ACTUAL_SPENDING : profile.TOTAL_PROJECTED_SPENDING;

  return (
    <div>
      <Navigation />
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <Breadcrumbs
            items={[
              { label: 'Dashboards', href: '/dashboards' },
              { label: 'AIP Analysis', href: '/aip-analysis' },
              { label: 'ACO List', href: '/aip-analysis/acos' },
              { label: profile.ACO_ID },
            ]}
          />

          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">{profile.ACO_NAME}</h1>
              <p className="text-sm text-gray-500 mt-1">
                {profile.ACO_ID} · {profile.ACO_TRACK}
              </p>
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

          {/* Performance Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-500">Beneficiaries</div>
              <div className="mt-2 text-3xl font-bold text-gray-900">
                {profile.ASSIGNED_BENEFICIARIES?.toLocaleString() || 'N/A'}
              </div>
              <div className="mt-2 text-xs text-gray-500">
                assigned
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-500">Savings Rate</div>
              <div className={`mt-2 text-3xl font-bold ${
                (profile.SAVINGS_RATE_PERCENT || 0) > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {profile.SAVINGS_RATE_PERCENT?.toFixed(2)}%
              </div>
              <div className="mt-2 text-xs text-gray-500">
                {profile.FINANCIAL_OUTCOME}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-500">Generated Savings</div>
              <div className={`mt-2 text-3xl font-bold ${
                (profile.GENERATED_SAVINGS_LOSS || 0) > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                ${((profile.GENERATED_SAVINGS_LOSS || 0) / 1000000).toFixed(2)}M
              </div>
              <div className="mt-2 text-xs text-gray-500">
                vs benchmark
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-500">Earned Potential</div>
              <div className={`mt-2 text-3xl font-bold ${
                (profile.EARNED_SAVINGS_LOSS || 0) > 0 ? 'text-blue-600' : 'text-gray-600'
              }`}>
                ${((profile.EARNED_SAVINGS_LOSS || 0) / 1000000).toFixed(2)}M
              </div>
              <div className="mt-2 text-xs text-gray-500">
                after share rate
              </div>
            </div>
          </div>

          {/* AIP Spending Summary */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">AIP Spending Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <div className="text-sm text-gray-500">Total Categories</div>
                <div className="mt-1 text-2xl font-bold text-gray-900">
                  {profile.NUM_CATEGORIES}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Subcategories</div>
                <div className="mt-1 text-2xl font-bold text-gray-900">
                  {profile.NUM_SUBCATEGORIES}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">
                  {isActualData ? 'Actual Spending' : 'Projected Spending'}
                </div>
                <div className="mt-1 text-2xl font-bold text-blue-600">
                  ${totalSpending?.toLocaleString() || '0'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Per Beneficiary</div>
                <div className="mt-1 text-2xl font-bold text-purple-600">
                  ${((totalSpending || 0) / (profile.ASSIGNED_BENEFICIARIES || 1)).toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Pie Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Spending Distribution</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${((entry.value / totalSpending) * 100).toFixed(1)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Category List */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Categories</h2>
              <div className="space-y-4">
                {profile.categories.map((cat, index) => {
                  const spending = isActualData ? cat.actual_spending : cat.projected_spending;
                  const pct = isActualData ? cat.pct_of_total_actual : cat.pct_of_total_projected;

                  return (
                    <div key={index} className="border-l-4 pl-4" style={{ borderColor: COLORS[index % COLORS.length] }}>
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-gray-900">{cat.category}</div>
                        <div className="text-sm font-semibold text-gray-900">
                          ${spending?.toLocaleString()}
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <div className="text-xs text-gray-500">
                          {cat.subcategories.length} subcategories
                        </div>
                        <div className="text-xs text-gray-500">
                          {pct?.toFixed(1)}% of total
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Subcategory Detail Tables */}
          {profile.categories.map((cat, catIndex) => (
            <div key={catIndex} className="bg-white rounded-lg shadow overflow-hidden mb-6">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-bold">{cat.category} - Subcategory Detail</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subcategory
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {isActualData ? 'Actual' : 'Projected'}
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        % of Category
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        % of Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {cat.subcategories.map((sub, subIndex) => {
                      const spending = isActualData ? sub.actual_spending : sub.projected_spending;
                      const pctOfCat = isActualData ? sub.pct_of_category_actual : sub.pct_of_category_projected;
                      const pctOfTotal = (spending / totalSpending) * 100;

                      return (
                        <tr key={subIndex}>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">{sub.subcategory}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                            ${spending.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                            {pctOfCat.toFixed(1)}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                            {pctOfTotal.toFixed(1)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          {/* Back Link */}
          <div className="mt-8">
            <Link
              href="/aip-analysis/acos"
              className="text-blue-600 hover:text-blue-900 font-medium"
            >
              ← Back to ACO List
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
