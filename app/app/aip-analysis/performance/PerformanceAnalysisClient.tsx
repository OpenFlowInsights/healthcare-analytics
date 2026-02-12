"use client";

import { useState, useMemo } from 'react';
import Navigation from "@/components/Navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter, ZAxis } from 'recharts';

interface PerformanceAnalysisClientProps {
  year: number;
  years: number[];
  data: any[];
}

export function PerformanceAnalysisClient({ year, years, data }: PerformanceAnalysisClientProps) {
  const router = useRouter();
  const [selectedYear, setSelectedYear] = useState(year);

  const handleYearChange = (newYear: number) => {
    setSelectedYear(newYear);
    router.push(`/aip-analysis/performance?year=${newYear}`);
  };

  // Calculate category-level metrics
  const categoryMetrics = useMemo(() => {
    const categories = new Map();
    let totalSpending = 0;

    data.forEach((row) => {
      const cat = row.SPENDING_CATEGORY;
      const spending = row.TOTAL_ACTUAL_SPENDING || row.TOTAL_PROJECTED_SPENDING || 0;
      const savingsRate = row.SAVINGS_RATE_PERCENT || 0;
      const genSavings = row.GENERATED_SAVINGS_LOSS || 0;

      totalSpending += spending;

      if (!categories.has(cat)) {
        categories.set(cat, {
          category: cat,
          totalSpending: 0,
          acos: new Set(),
          savingsRates: [],
          positiveSavings: 0,
          negativeSavings: 0,
          totalGenSavings: 0,
        });
      }

      const catData = categories.get(cat);
      catData.totalSpending += spending;
      catData.acos.add(row.ACO_ID);
      catData.savingsRates.push(savingsRate);
      catData.totalGenSavings += genSavings;
      if (genSavings > 0) catData.positiveSavings++;
      if (genSavings < 0) catData.negativeSavings++;
    });

    const results = Array.from(categories.values()).map((cat) => ({
      category: cat.category,
      totalSpending: cat.totalSpending,
      pctOfTotal: (cat.totalSpending / totalSpending) * 100,
      numACOs: cat.acos.size,
      avgSavingsRate: cat.savingsRates.reduce((a: number, b: number) => a + b, 0) / cat.savingsRates.length,
      positiveSavings: cat.positiveSavings,
      negativeSavings: cat.negativeSavings,
      totalGenSavings: cat.totalGenSavings,
    })).sort((a, b) => b.totalSpending - a.totalSpending);

    return { categories: results, totalSpending };
  }, [data]);

  // ACO-level detail by category
  const acosByCategory = useMemo(() => {
    const result = new Map();

    data.forEach((row) => {
      const cat = row.SPENDING_CATEGORY;
      if (!result.has(cat)) {
        result.set(cat, []);
      }

      const existing = result.get(cat).find((a: any) => a.ACO_ID === row.ACO_ID);
      if (existing) {
        existing.spending += row.TOTAL_ACTUAL_SPENDING || row.TOTAL_PROJECTED_SPENDING || 0;
      } else {
        result.get(cat).push({
          ACO_ID: row.ACO_ID,
          ACO_NAME: row.ACO_NAME,
          spending: row.TOTAL_ACTUAL_SPENDING || row.TOTAL_PROJECTED_SPENDING || 0,
          savingsRate: row.SAVINGS_RATE_PERCENT || 0,
          genSavings: row.GENERATED_SAVINGS_LOSS || 0,
        });
      }
    });

    // Sort ACOs by spending within each category
    result.forEach((acos) => {
      acos.sort((a: any, b: any) => b.spending - a.spending);
    });

    return result;
  }, [data]);

  const chartData = categoryMetrics.categories.map((cat) => ({
    name: cat.category,
    'Spending': cat.totalSpending,
    'Avg Savings Rate': cat.avgSavingsRate,
    '% of Total': cat.pctOfTotal,
  }));

  // Scatter plot data: spending vs savings rate
  const scatterData = categoryMetrics.categories.map((cat) => ({
    category: cat.category,
    spending: cat.totalSpending,
    savingsRate: cat.avgSavingsRate,
    size: cat.numACOs * 100,
  }));

  const isActualData = selectedYear === 2024;

  return (
    <div>
      <Navigation />
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <Breadcrumbs
            items={[
              { label: 'Dashboards', href: '/dashboards' },
              { label: 'AIP Analysis', href: '/aip-analysis' },
              { label: 'Performance Analysis' },
            ]}
          />

          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">AIP Spending & Performance Analysis</h1>
              <p className="text-sm text-gray-500 mt-1">Category spending breakdown with ACO shared savings rates</p>
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
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-500">Total Spending</div>
              <div className="mt-2 text-3xl font-bold text-gray-900">
                ${(categoryMetrics.totalSpending / 1000000).toFixed(1)}M
              </div>
              <div className="mt-2 text-xs text-gray-500">
                {isActualData ? 'actual' : 'projected'}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-500">Categories</div>
              <div className="mt-2 text-3xl font-bold text-gray-900">
                {categoryMetrics.categories.length}
              </div>
              <div className="mt-2 text-xs text-gray-500">
                spending categories
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-500">Avg Savings Rate</div>
              <div className="mt-2 text-3xl font-bold text-green-600">
                {(categoryMetrics.categories.reduce((sum: number, c) => sum + c.avgSavingsRate, 0) / categoryMetrics.categories.length).toFixed(2)}%
              </div>
              <div className="mt-2 text-xs text-gray-500">
                across all ACOs
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-500">Total ACOs</div>
              <div className="mt-2 text-3xl font-bold text-gray-900">
                {new Set(data.map((d) => d.ACO_ID)).size}
              </div>
              <div className="mt-2 text-xs text-gray-500">
                with AIP spending
              </div>
            </div>
          </div>

          {/* Category Spending & Savings Rate Chart */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">Spending vs Savings Rate by Category</h2>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-15} textAnchor="end" height={100} />
                <YAxis yAxisId="left" tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`} />
                <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => `${value.toFixed(1)}%`} />
                <Tooltip formatter={(value) => (typeof value === 'number' ? value.toLocaleString() : value)} />
                <Legend />
                <Bar yAxisId="left" dataKey="Spending" fill="#2563eb" />
                <Bar yAxisId="right" dataKey="Avg Savings Rate" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Category Summary Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold">Category Performance Summary</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Spending
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      % of Total
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ACOs
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
                  {categoryMetrics.categories.map((cat, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{cat.category}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                        ${cat.totalSpending.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                        {cat.pctOfTotal.toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                        {cat.numACOs}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-semibold ${
                        cat.avgSavingsRate > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {cat.avgSavingsRate.toFixed(2)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <span className="text-green-600">{cat.positiveSavings}↑</span>
                        {' / '}
                        <span className="text-red-600">{cat.negativeSavings}↓</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ACO Detail by Category */}
          {categoryMetrics.categories.map((cat) => {
            const acos = acosByCategory.get(cat.category) || [];
            const catTotal = cat.totalSpending;

            return (
              <div key={cat.category} className="bg-white rounded-lg shadow overflow-hidden mb-6">
                <div className="px-6 py-4 border-b border-gray-200 bg-blue-50">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold">{cat.category}</h3>
                    <div className="text-sm text-gray-600">
                      ${cat.totalSpending.toLocaleString()} ({cat.pctOfTotal.toFixed(1)}% of total) | Avg: {cat.avgSavingsRate.toFixed(2)}%
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ACO ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ACO Name
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Spending
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          % of Category
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Savings Rate
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Generated Savings
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {acos.map((aco: any, index: number) => {
                        const pctCat = (aco.spending / catTotal) * 100;
                        return (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              <Link href={`/aip-analysis/aco/${aco.ACO_ID}?year=${selectedYear}`} className="text-blue-600 hover:text-blue-800">
                                {aco.ACO_ID}
                              </Link>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {aco.ACO_NAME}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                              ${aco.spending.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                              {pctCat.toFixed(1)}%
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-semibold ${
                              aco.savingsRate > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {aco.savingsRate.toFixed(2)}%
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-right text-sm ${
                              aco.genSavings > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              ${aco.genSavings.toLocaleString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}

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
