"use client";

import { useQuery } from "@tanstack/react-query";
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
import { useState } from "react";
import Navigation from "@/components/Navigation";

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

// Loading Skeleton
const LoadingSkeleton = () => (
  <div className="animate-pulse">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="bg-white p-6 rounded-lg shadow h-32" />
      ))}
    </div>
    <div className="bg-white p-6 rounded-lg shadow mb-8 h-96" />
    <div className="bg-white p-6 rounded-lg shadow mb-8 h-96" />
  </div>
);

export default function DrugSpendingDashboard() {
  const [sortColumn, setSortColumn] = useState<string>("total_spending");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [showAll, setShowAll] = useState(false);

  // Fetch data from all endpoints
  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ["drug-spend-summary"],
    queryFn: async () => {
      const res = await fetch("/api/snowflake/drug-spend-summary");
      if (!res.ok) throw new Error("Failed to fetch summary");
      return res.json();
    },
  });

  const { data: trendData, isLoading: trendLoading } = useQuery({
    queryKey: ["drug-spend-trend"],
    queryFn: async () => {
      const res = await fetch("/api/snowflake/drug-spend-trend");
      if (!res.ok) throw new Error("Failed to fetch trend");
      return res.json();
    },
  });

  const { data: driversData, isLoading: driversLoading } = useQuery({
    queryKey: ["drug-spend-drivers"],
    queryFn: async () => {
      const res = await fetch("/api/snowflake/drug-spend-drivers?limit=20");
      if (!res.ok) throw new Error("Failed to fetch drivers");
      return res.json();
    },
  });

  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ["drug-spend-categories"],
    queryFn: async () => {
      const res = await fetch("/api/snowflake/drug-spend-categories");
      if (!res.ok) throw new Error("Failed to fetch categories");
      return res.json();
    },
  });

  const isLoading = summaryLoading || trendLoading || driversLoading || categoriesLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Drug Spending Dashboard</h1>
        <LoadingSkeleton />
      </div>
    );
  }

  const summary = summaryData?.[0] || {};
  const trends = trendData || [];
  const drivers = driversData || [];
  const categories = categoriesData || [];

  // Get latest quarter for categories
  const latestQuarter = categories.length > 0
    ? Math.max(...categories.map((c: any) => new Date(c.period).getTime()))
    : null;
  const latestCategories = latestQuarter
    ? categories.filter((c: any) => new Date(c.period).getTime() === latestQuarter)
    : [];

  // Prepare treemap data
  const treemapData = latestCategories.map((cat: any, index: number) => ({
    name: cat.category,
    value: cat.total_spending,
    fill: [
      "#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444",
      "#ec4899", "#14b8a6", "#6366f1", "#84cc16", "#f97316"
    ][index % 10],
  }));

  // Handle sorting
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("desc");
    }
  };

  const sortedDrivers = [...drivers].sort((a: any, b: any) => {
    const aVal = a[sortColumn];
    const bVal = b[sortColumn];

    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;

    if (sortDirection === "asc") {
      return aVal > bVal ? 1 : -1;
    }
    return aVal < bVal ? 1 : -1;
  });

  const displayedDrivers = showAll ? sortedDrivers : sortedDrivers.slice(0, 10);

  // Prepare combined trend data
  const combinedTrends = trends.map((t: any) => ({
    period: t.period,
    part_d_spending: t.part_d_spending || 0,
    part_b_spending: t.part_b_spending || 0,
    total_spending: (t.part_d_spending || 0) + (t.part_b_spending || 0),
  }));

  return (
    <div>
      <Navigation />
      <div className="min-h-screen bg-gray-50 p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Drug Spending Dashboard</h1>

      {/* Row 1: KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <KPICard
          title="Total Part B Spend"
          value={formatCurrency(summary.total_part_b_spend || 0)}
          icon={<DollarSign className="w-6 h-6" />}
          color="blue"
        />
        <KPICard
          title="Total Part D Spend"
          value={formatCurrency(summary.total_part_d_spend || 0)}
          icon={<Pill className="w-6 h-6" />}
          color="purple"
        />
        <KPICard
          title="Combined Total"
          value={formatCurrency(summary.combined_total || 0)}
          icon={<TrendingUp className="w-6 h-6" />}
          color="green"
        />
        <KPICard
          title="QoQ Change"
          value={formatPercent(summary.combined_qoq_change_pct || 0)}
          icon={
            summary.combined_qoq_change_pct >= 0 ? (
              <TrendingUp className="w-6 h-6" />
            ) : (
              <TrendingDown className="w-6 h-6" />
            )
          }
          color={summary.combined_qoq_change_pct >= 0 ? "green" : "red"}
          trend={summary.combined_qoq_change_pct >= 0 ? "up" : "down"}
        />
        <KPICard
          title="Top Drug"
          value={summary.top_drug_brand || "N/A"}
          icon={<Activity className="w-6 h-6" />}
          color="orange"
          subtitle="Highest spending"
        />
      </div>

      {/* Row 2: Quarterly Trend Chart */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quarterly Spending Trend</h2>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={combinedTrends}>
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
              dataKey="part_d_spending"
              stroke="#8b5cf6"
              strokeWidth={2}
              name="Part D"
              dot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="part_b_spending"
              stroke="#3b82f6"
              strokeWidth={2}
              name="Part B"
              dot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="total_spending"
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
              dataKey="brand_name"
              width={140}
              tick={{ fontSize: 11 }}
            />
            <Tooltip
              formatter={(value: any, name: string | undefined) => {
                if (name === "total_spending") {
                  return [formatCurrencyDetailed(value), "Total Spending"];
                }
                return [value, name];
              }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white p-4 rounded shadow-lg border">
                      <p className="font-bold">{data.brand_name}</p>
                      <p className="text-sm text-gray-600">{data.generic_name}</p>
                      <p className="text-sm mt-2">
                        <span className="font-semibold">Program:</span> {data.program}
                      </p>
                      <p className="text-sm">
                        <span className="font-semibold">Spending:</span>{" "}
                        {formatCurrencyDetailed(data.total_spending)}
                      </p>
                      <p className="text-sm">
                        <span className="font-semibold">QoQ Growth:</span>{" "}
                        <span
                          className={
                            data.qoq_growth_pct >= 0 ? "text-green-600" : "text-red-600"
                          }
                        >
                          {formatPercent(data.qoq_growth_pct)}
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
              dataKey="total_spending"
              fill="#8b5cf6"
              name="Total Spending"
              radius={[0, 4, 4, 0]}
            >
              {drivers.slice(0, 20).map((entry: any, index: number) => (
                <Bar
                  key={`bar-${index}`}
                  fill={entry.program === "Part D" ? "#8b5cf6" : "#3b82f6"}
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
                formatter={(value: any, name: string | undefined) => {
                  if (name === "value") {
                    return [formatCurrencyDetailed(value), "Spending"];
                  }
                  return [value, name];
                }}
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
                  onClick={() => handleSort("brand_name")}
                >
                  Brand Name {sortColumn === "brand_name" && (sortDirection === "asc" ? "↑" : "↓")}
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("generic_name")}
                >
                  Generic Name {sortColumn === "generic_name" && (sortDirection === "asc" ? "↑" : "↓")}
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("program")}
                >
                  Program {sortColumn === "program" && (sortDirection === "asc" ? "↑" : "↓")}
                </th>
                <th
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("total_spending")}
                >
                  Total Spend {sortColumn === "total_spending" && (sortDirection === "asc" ? "↑" : "↓")}
                </th>
                <th
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("total_claims")}
                >
                  Total Claims {sortColumn === "total_claims" && (sortDirection === "asc" ? "↑" : "↓")}
                </th>
                <th
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("avg_cost_per_claim")}
                >
                  Avg Cost/Claim {sortColumn === "avg_cost_per_claim" && (sortDirection === "asc" ? "↑" : "↓")}
                </th>
                <th
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("qoq_growth_pct")}
                >
                  QoQ Change {sortColumn === "qoq_growth_pct" && (sortDirection === "asc" ? "↑" : "↓")}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {displayedDrivers.map((driver: any, index: number) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {driver.brand_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {driver.generic_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        driver.program === "Part D"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {driver.program}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                    {formatCurrencyDetailed(driver.total_spending)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {driver.total_claims?.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {formatCurrencyDetailed(driver.avg_cost_per_claim)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                    <span
                      className={`font-medium ${
                        driver.qoq_growth_pct >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {formatPercent(driver.qoq_growth_pct)}
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
              {showAll ? "Show Less" : `Show All (${sortedDrivers.length} total)`}
            </button>
          </div>
        )}
      </div>
    </div>
    </div>
  );
}
