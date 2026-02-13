"use client";

import { useState, useMemo } from "react";
import {
  DollarSign,
  Pill,
  TrendingUp,
  TrendingDown,
  Activity,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Treemap,
} from "recharts";
import Navigation from "@/components/Navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import type {
  DrugSpendSummary,
  DrugSpendTrend,
  DrugDriver,
  DrugDriverComparison,
  DrugCategory,
  YearComparisonData,
} from '@/lib/data/drug-spending';

interface DrugSpendingDashboardClientProps {
  data: {
    summary: DrugSpendSummary;
    trend: DrugSpendTrend[];
    drivers: DrugDriverComparison[];
    categories: DrugCategory[];
    yearComparison: YearComparisonData[];
    buildTimestamp: string;
  };
}

// Helper functions
const formatCurrency = (value: number): string => {
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(1)}K`;
  }
  return `$${value.toFixed(0)}`;
};

const formatPercent = (value: number): string => {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
};

const formatCurrencyDetailed = (value: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// Custom Treemap Content
const CustomTreemapContent = (props: any) => {
  const { x, y, width, height, name, value, fill } = props;

  if (width < 50 || height < 50) return null;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fill}
        stroke="#fff"
        strokeWidth={2}
      />
      {width > 100 && height > 60 && (
        <g>
          <text
            x={x + width / 2}
            y={y + height / 2 - 10}
            textAnchor="middle"
            fill="#fff"
            fontSize={14}
            fontWeight="bold"
          >
            {name}
          </text>
          <text
            x={x + width / 2}
            y={y + height / 2 + 10}
            textAnchor="middle"
            fill="#fff"
            fontSize={12}
          >
            {formatCurrency(value)}
          </text>
        </g>
      )}
    </g>
  );
};

// KPI Card Component
interface KPICardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
  trend?: "up" | "down";
}

const KPICard = ({ title, value, icon, color, subtitle, trend }: KPICardProps) => {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-600",
    purple: "bg-purple-100 text-purple-600",
    green: "bg-green-100 text-green-600",
    red: "bg-red-100 text-red-600",
    orange: "bg-orange-100 text-orange-600",
  }[color] || "bg-gray-100 text-gray-600";

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <div className="flex items-center mt-2">
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {trend && (
              <span className="ml-2">
                {trend === "up" ? (
                  <ArrowUp className="w-5 h-5 text-green-600" />
                ) : (
                  <ArrowDown className="w-5 h-5 text-red-600" />
                )}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-full ${colorClasses}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export function DrugSpendingDashboardClient({ data }: DrugSpendingDashboardClientProps) {
  const { summary, trend, drivers, categories, yearComparison, buildTimestamp } = data;

  const [sortColumn, setSortColumn] = useState<string>("TOTAL_SPENDING");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [showAll, setShowAll] = useState(false);

  // Client-side filtering by program
  const [selectedProgram, setSelectedProgram] = useState<string>('all');
  
  // Get latest quarter for categories
  const latestCategories = useMemo(() => {
    if (categories.length === 0) return [];
    // Group by year/quarter and get the latest
    const latestPeriod = categories[0]; // Already sorted by year/quarter desc in SQL
    return categories.filter(
      c => c.YEAR === latestPeriod.YEAR && c.QUARTER === latestPeriod.QUARTER
    );
  }, [categories]);

  // Prepare treemap data
  const treemapData = useMemo(() => latestCategories.map((cat, index) => ({
    name: cat.CATEGORY,
    value: cat.TOTAL_SPENDING,
    fill: [
      "#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444",
      "#ec4899", "#14b8a6", "#6366f1", "#84cc16", "#f97316"
    ][index % 10],
  })), [latestCategories]);

  // Handle sorting
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("desc");
    }
  };

  // Sort drivers
  const sortedDrivers = useMemo(() => {
    const sorted = [...drivers].sort((a, b) => {
      const aVal = a[sortColumn as keyof DrugDriver];
      const bVal = b[sortColumn as keyof DrugDriver];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      const numA = Number(aVal);
      const numB = Number(bVal);
      return sortDirection === "asc" ? numA - numB : numB - numA;
    });

    return sorted;
  }, [drivers, sortColumn, sortDirection]);

  const displayedDrivers = showAll ? sortedDrivers : sortedDrivers.slice(0, 10);

  // Prepare combined trend data - group by period and sum by program
  const chartData = useMemo(() => {
    const grouped = trend.reduce((acc, t) => {
      if (!acc[t.PERIOD]) {
        acc[t.PERIOD] = { period: t.PERIOD, partDSpending: 0, partBSpending: 0, totalSpending: 0 };
      }
      if (t.PROGRAM === 'Part D') {
        acc[t.PERIOD].partDSpending += t.TOTAL_SPENDING || 0;
      } else if (t.PROGRAM === 'Part B') {
        acc[t.PERIOD].partBSpending += t.TOTAL_SPENDING || 0;
      }
      acc[t.PERIOD].totalSpending += t.TOTAL_SPENDING || 0;
      return acc;
    }, {} as Record<string, any>);

    return Object.values(grouped).reverse();
  }, [trend]);

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
              { label: 'Drug Spending Analysis' },
            ]}
          />
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Drug Spending Dashboard</h1>
            <div className="text-sm text-gray-500">
              Data as of: {formattedDate}
            </div>
          </div>

          {/* Row 1: KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <KPICard
              title="Total Part B Spend"
              value={formatCurrency(summary.PARTB_SPENDING || 0)}
              icon={<DollarSign className="w-6 h-6" />}
              color="blue"
            />
            <KPICard
              title="Total Part D Spend"
              value={formatCurrency(summary.PARTD_SPENDING || 0)}
              icon={<Pill className="w-6 h-6" />}
              color="purple"
            />
            <KPICard
              title="Combined Total"
              value={formatCurrency(summary.COMBINED_TOTAL_SPENDING || 0)}
              icon={<TrendingUp className="w-6 h-6" />}
              color="green"
            />
            <KPICard
              title="QoQ Change"
              value={formatPercent(summary.COMBINED_QOQ_CHANGE_PCT || 0)}
              icon={
                summary.COMBINED_QOQ_CHANGE_PCT >= 0 ? (
                  <TrendingUp className="w-6 h-6" />
                ) : (
                  <TrendingDown className="w-6 h-6" />
                )
              }
              color={summary.COMBINED_QOQ_CHANGE_PCT >= 0 ? "green" : "red"}
              trend={summary.COMBINED_QOQ_CHANGE_PCT >= 0 ? "up" : "down"}
            />
            <KPICard
              title="Top Drug"
              value={summary.TOP_DRUG_BRAND || "N/A"}
              icon={<Activity className="w-6 h-6" />}
              color="orange"
              subtitle="Highest spending"
            />
          </div>

          {/* Row 2: Top 20 Drugs Bar Chart */}
          <div className="bg-white p-6 rounded-lg shadow mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Top 20 Drugs by Spending</h2>
              {drivers.length > 0 && drivers[0].YEAR && drivers[0].QUARTER && (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                  {drivers[0].YEAR} {drivers[0].QUARTER}
                </span>
              )}
            </div>
            <ResponsiveContainer width="100%" height={600}>
              <BarChart
                data={drivers.slice(0, 20)}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 150, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  tickFormatter={(value) => formatCurrency(value)}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  type="category"
                  dataKey="BRAND_NAME"
                  width={140}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-4 rounded shadow-lg border">
                          <p className="font-bold">{data.BRAND_NAME}</p>
                          <p className="text-sm text-gray-600">{data.GENERIC_NAME}</p>
                          <p className="text-sm mt-2">
                            <span className="font-semibold">Program:</span> {data.PROGRAM}
                          </p>
                          <p className="text-sm">
                            <span className="font-semibold">Spending:</span>{" "}
                            {formatCurrencyDetailed(data.TOTAL_SPENDING)}
                          </p>
                          <p className="text-sm">
                            <span className="font-semibold">QoQ Growth:</span>{" "}
                            <span
                              className={
                                data.QOQ_GROWTH_PCT >= 0 ? "text-green-600" : "text-red-600"
                              }
                            >
                              {formatPercent(data.QOQ_GROWTH_PCT)}
                            </span>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                <Bar
                  dataKey="TOTAL_SPENDING"
                  fill="#8b5cf6"
                  name="Total Spending"
                  radius={[0, 4, 4, 0]}
                >
                  {drivers.slice(0, 20).map((entry, index) => (
                    <Bar
                      key={`bar-${index}`}
                      fill={entry.PROGRAM === "Part D" ? "#8b5cf6" : "#3b82f6"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Row 4: Spending Composition Analysis */}
          {yearComparison && yearComparison.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow mb-8">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Spending Composition Change</h2>
              <p className="text-sm text-gray-600 mb-4">
                How Part D vs Part B spending mix has shifted from 2024 to projected 2025
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* 2024 Composition */}
              {(() => {
                const partD2024 = yearComparison.find(d => d.program === 'Part D' && d.year?.includes('2024'));
                const partB2024 = yearComparison.find(d => d.program === 'Part B' && d.year?.includes('2024'));
                const total2024 = (partD2024?.actual_spending || 0) + (partB2024?.actual_spending || 0);
                const partDPct2024 = total2024 > 0 ? (partD2024?.actual_spending || 0) / total2024 * 100 : 0;
                const partBPct2024 = total2024 > 0 ? (partB2024?.actual_spending || 0) / total2024 * 100 : 0;

                const partD2025 = yearComparison.find(d => d.program === 'Part D' && d.year?.includes('2025'));
                const partB2025 = yearComparison.find(d => d.program === 'Part B' && d.year?.includes('2025'));
                const total2025 = (partD2025?.annualized_spending || 0) + (partB2025?.annualized_spending || 0);
                const partDPct2025 = total2025 > 0 ? (partD2025?.annualized_spending || 0) / total2025 * 100 : 0;
                const partBPct2025 = total2025 > 0 ? (partB2025?.annualized_spending || 0) / total2025 * 100 : 0;

                const partDChange = partDPct2025 - partDPct2024;
                const partBChange = partBPct2025 - partBPct2024;

                return (
                  <>
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <h3 className="font-semibold text-gray-700 mb-4">2024 Full Year</h3>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium text-purple-600">Part D</span>
                            <span className="text-sm font-bold">{partDPct2024.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div className="bg-purple-600 h-3 rounded-full" style={{ width: `${partDPct2024}%` }}></div>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">{formatCurrency(partD2024?.actual_spending || 0)}</p>
                        </div>
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium text-blue-600">Part B</span>
                            <span className="text-sm font-bold">{partBPct2024.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div className="bg-blue-600 h-3 rounded-full" style={{ width: `${partBPct2024}%` }}></div>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">{formatCurrency(partB2024?.actual_spending || 0)}</p>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-300">
                        <div className="flex justify-between">
                          <span className="text-sm font-semibold">Total:</span>
                          <span className="text-sm font-bold">{formatCurrency(total2024)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-green-50 p-6 rounded-lg border-2 border-green-200">
                      <h3 className="font-semibold text-gray-700 mb-4">2025 Projected</h3>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium text-purple-600">Part D</span>
                            <span className="text-sm font-bold">{partDPct2025.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div className="bg-purple-600 h-3 rounded-full" style={{ width: `${partDPct2025}%` }}></div>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">{formatCurrency(partD2025?.annualized_spending || 0)}</p>
                        </div>
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium text-blue-600">Part B</span>
                            <span className="text-sm font-bold">{partBPct2025.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div className="bg-blue-600 h-3 rounded-full" style={{ width: `${partBPct2025}%` }}></div>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">{formatCurrency(partB2025?.annualized_spending || 0)}</p>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-green-300">
                        <div className="flex justify-between">
                          <span className="text-sm font-semibold">Total:</span>
                          <span className="text-sm font-bold">{formatCurrency(total2025)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 p-6 rounded-lg">
                      <h3 className="font-semibold text-gray-700 mb-4">Composition Shift</h3>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-purple-600">Part D Mix Change</span>
                            <span className={`text-lg font-bold ${partDChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {partDChange >= 0 ? '+' : ''}{partDChange.toFixed(2)}pp
                            </span>
                          </div>
                          <p className="text-xs text-gray-600">
                            {partDPct2024.toFixed(1)}% → {partDPct2025.toFixed(1)}%
                          </p>
                        </div>
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-blue-600">Part B Mix Change</span>
                            <span className={`text-lg font-bold ${partBChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {partBChange >= 0 ? '+' : ''}{partBChange.toFixed(2)}pp
                            </span>
                          </div>
                          <p className="text-xs text-gray-600">
                            {partBPct2024.toFixed(1)}% → {partBPct2025.toFixed(1)}%
                          </p>
                        </div>
                        <div className="mt-4 pt-4 border-t border-blue-200">
                          <p className="text-xs text-gray-600 italic">
                            pp = percentage points
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
          )}

          {/* Row 5: Detailed Table */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Detailed Drug Analysis: 2024 vs 2025 Comparison</h2>
              <p className="text-sm text-gray-600">
                2024 Full Year (Q1-Q4) vs 2025 (Q1-Q2). Spending and claims are annualized (× 2). Beneficiaries show actual Q1-Q2 counts.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th rowSpan={2} className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                      Brand Name
                    </th>
                    <th rowSpan={2} className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                      Generic Name
                    </th>
                    <th colSpan={4} className="px-3 py-2 text-center text-xs font-medium text-blue-700 uppercase tracking-wider border-r border-gray-300 bg-blue-50">
                      2024 Full Year (Q1-Q4)
                    </th>
                    <th colSpan={4} className="px-3 py-2 text-center text-xs font-medium text-green-700 uppercase tracking-wider bg-green-50">
                      2025 (Q1-Q2)
                    </th>
                  </tr>
                  <tr>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50">Spend</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50">Claims</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50">Avg$/Claim</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300 bg-blue-50">Benes</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider bg-green-50">Spend (×2)</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider bg-green-50">Claims (×2)</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider bg-green-50">Avg$/Claim</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider bg-green-50">Benes (Actual)</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {displayedDrivers.map((driver, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-3 py-3 text-sm font-medium text-gray-900 border-r border-gray-200">
                        {driver.BRAND_NAME}
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-600 border-r border-gray-200">
                        {driver.GENERIC_NAME}
                      </td>
                      {/* 2024 Data */}
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-right font-medium text-blue-900 bg-blue-50">
                        {driver.SPENDING_2024 ? formatCurrency(driver.SPENDING_2024) : '-'}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-right text-blue-900 bg-blue-50">
                        {driver.CLAIMS_2024 ? driver.CLAIMS_2024.toLocaleString() : '-'}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-right text-blue-900 bg-blue-50">
                        {driver.AVG_COST_CLAIM_2024 ? `$${driver.AVG_COST_CLAIM_2024.toFixed(2)}` : '-'}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-right text-blue-900 border-r border-gray-300 bg-blue-50">
                        {driver.BENES_2024 ? driver.BENES_2024.toLocaleString() : '-'}
                      </td>
                      {/* 2025 Annualized Data */}
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-right font-medium text-green-900 bg-green-50">
                        {driver.SPENDING_2025_ANNUALIZED ? formatCurrency(driver.SPENDING_2025_ANNUALIZED) : '-'}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-right text-green-900 bg-green-50">
                        {driver.CLAIMS_2025_ANNUALIZED ? driver.CLAIMS_2025_ANNUALIZED.toLocaleString() : '-'}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-right text-green-900 bg-green-50">
                        {driver.AVG_COST_CLAIM_2025 ? `$${driver.AVG_COST_CLAIM_2025.toFixed(2)}` : '-'}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-right text-green-900 bg-green-50">
                        {driver.BENES_2025_ACTUAL ? driver.BENES_2025_ACTUAL.toLocaleString() : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {sortedDrivers.length > 10 && (
              <div className="mt-4 text-center">
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {showAll ? "Show Top 10" : `Show All (${sortedDrivers.length} total)`}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
