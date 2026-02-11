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
  DrugCategory,
} from '@/lib/data/drug-spending';

interface DrugSpendingDashboardClientProps {
  data: {
    summary: DrugSpendSummary;
    trend: DrugSpendTrend[];
    drivers: DrugDriver[];
    categories: DrugCategory[];
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
  const { summary, trend, drivers, categories, buildTimestamp } = data;

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

          {/* Row 2: Quarterly Trend Chart */}
          <div className="bg-white p-6 rounded-lg shadow mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Quarterly Spending Trend</h2>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="period"
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  tickFormatter={(value) => formatCurrency(value)}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  formatter={(value: any) => formatCurrencyDetailed(value)}
                  labelStyle={{ color: "#000" }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="partDSpending"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  name="Part D"
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="partBSpending"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Part B"
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="totalSpending"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Combined"
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Row 3: Top 20 Drugs Bar Chart */}
          <div className="bg-white p-6 rounded-lg shadow mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Top 20 Drugs by Spending</h2>
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

          {/* Row 4: Category Treemap */}
          {treemapData.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Drug Categories (Latest Quarter)
              </h2>
              <ResponsiveContainer width="100%" height={400}>
                <Treemap
                  data={treemapData}
                  dataKey="value"
                  aspectRatio={4 / 3}
                  stroke="#fff"
                  content={<CustomTreemapContent />}
                >
                  <Tooltip
                    formatter={(value: any) => [formatCurrencyDetailed(value), "Spending"]}
                  />
                </Treemap>
              </ResponsiveContainer>
            </div>
          )}

          {/* Row 5: Detailed Table */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Detailed Drug Analysis</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("BRAND_NAME")}
                    >
                      Brand Name {sortColumn === "BRAND_NAME" && (sortDirection === "asc" ? "↑" : "↓")}
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("GENERIC_NAME")}
                    >
                      Generic Name {sortColumn === "GENERIC_NAME" && (sortDirection === "asc" ? "↑" : "↓")}
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("PROGRAM")}
                    >
                      Program {sortColumn === "PROGRAM" && (sortDirection === "asc" ? "↑" : "↓")}
                    </th>
                    <th
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("TOTAL_SPENDING")}
                    >
                      Total Spend {sortColumn === "TOTAL_SPENDING" && (sortDirection === "asc" ? "↑" : "↓")}
                    </th>
                    <th
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("TOTAL_CLAIMS")}
                    >
                      Total Claims {sortColumn === "TOTAL_CLAIMS" && (sortDirection === "asc" ? "↑" : "↓")}
                    </th>
                    <th
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("AVG_SPENDING_PER_CLAIM")}
                    >
                      Avg Cost/Claim {sortColumn === "AVG_SPENDING_PER_CLAIM" && (sortDirection === "asc" ? "↑" : "↓")}
                    </th>
                    <th
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("QOQ_GROWTH_PCT")}
                    >
                      QoQ Change {sortColumn === "QOQ_GROWTH_PCT" && (sortDirection === "asc" ? "↑" : "↓")}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {displayedDrivers.map((driver, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {driver.BRAND_NAME}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {driver.GENERIC_NAME}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            driver.PROGRAM === "Part D"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {driver.PROGRAM}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                        {formatCurrencyDetailed(driver.TOTAL_SPENDING)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {driver.TOTAL_CLAIMS?.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {formatCurrencyDetailed(driver.AVG_SPENDING_PER_CLAIM)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        <span
                          className={`font-medium ${
                            driver.QOQ_GROWTH_PCT >= 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {formatPercent(driver.QOQ_GROWTH_PCT)}
                        </span>
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
