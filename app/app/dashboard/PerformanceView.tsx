"use client";

import { useState, useMemo } from 'react';
import { BarChart, Users, DollarSign, TrendingUp, TrendingDown, Minus, X } from "lucide-react";
import type { MultiYearDashboardData, DashboardSummary, ACORanking } from '@/lib/data/aco';

interface PerformanceViewProps {
  data: MultiYearDashboardData;
  selectedYear: number;
  onYearChange: (year: number) => void;
  onACOClick?: (acoId: string) => void;
}

interface YoYIndicator {
  value: number;
  percentage: number;
  isPositive: boolean;
  isNeutral: boolean;
}

// Extended ACO ranking with YoY data
interface ACORankingWithYoY extends ACORanking {
  PREV_SAVINGS_RATE_PCT?: number;
  PREV_QUALITY_SCORE?: number;
  SAVINGS_RATE_YOY: number | null;
  QUALITY_SCORE_YOY: number | null;
}

// YoY Indicator Component
const YoYIndicatorComponent = ({ yoy, label, formatValue }: {
  yoy: YoYIndicator | null;
  label: string;
  formatValue: (val: number) => string;
}) => {
  if (!yoy) {
    return <span className="text-xs text-gray-400">—</span>;
  }

  if (yoy.isNeutral) {
    return (
      <div className="flex items-center gap-1 text-xs text-gray-500">
        <Minus className="h-3 w-3" />
        <span>vs {label}</span>
      </div>
    );
  }

  const Icon = yoy.isPositive ? TrendingUp : TrendingDown;
  const colorClass = yoy.isPositive ? 'text-green-600' : 'text-red-600';

  return (
    <div className={`flex items-center gap-1 text-xs ${colorClass}`}>
      <Icon className="h-3 w-3" />
      <span>{formatValue(Math.abs(yoy.value))}</span>
      <span className="text-gray-500">vs {label}</span>
    </div>
  );
};

export function PerformanceView({ data, selectedYear, onYearChange, onACOClick }: PerformanceViewProps) {
  const { years, dataByYear } = data;

  // Client-side state for filtering/sorting
  const [sortColumn, setSortColumn] = useState<string>('SAVINGS_RATE_RANK');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [hasFQHCs, setHasFQHCs] = useState<boolean | undefined>(undefined);
  const [minFQHCPct, setMinFQHCPct] = useState<number | undefined>(undefined);
  const [maxFQHCPct, setMaxFQHCPct] = useState<number | undefined>(undefined);

  // Get current year and previous year data
  const currentYearData = dataByYear[selectedYear];
  const prevYear = selectedYear - 1;
  const prevYearData = dataByYear[prevYear];

  const summary = currentYearData?.summary || {} as DashboardSummary;
  const rankings = currentYearData?.rankings || [];
  const prevSummary = prevYearData?.summary;

  // Calculate YoY indicators for KPIs
  const calculateYoY = (current: number, previous: number | undefined, isPositiveGood: boolean = true): YoYIndicator | null => {
    if (previous === undefined || previous === 0) return null;

    const value = current - previous;
    const percentage = (value / previous) * 100;
    const isPositive = isPositiveGood ? value > 0 : value < 0;
    const isNeutral = Math.abs(value) < 0.01;

    return { value, percentage, isPositive, isNeutral };
  };

  const acosYoY = calculateYoY(summary.TOTAL_ACOS || 0, prevSummary?.TOTAL_ACOS);
  const beneficiariesYoY = calculateYoY(summary.TOTAL_BENEFICIARIES || 0, prevSummary?.TOTAL_BENEFICIARIES);
  const savingsRateYoY = calculateYoY(summary.AVG_SAVINGS_RATE_PCT || 0, prevSummary?.AVG_SAVINGS_RATE_PCT);
  const totalSavingsYoY = calculateYoY(summary.TOTAL_SAVINGS_LOSSES || 0, prevSummary?.TOTAL_SAVINGS_LOSSES);

  // Get YoY data for individual ACOs
  const rankingsWithYoY = useMemo((): ACORankingWithYoY[] => {
    if (!prevYearData) return rankings.map(aco => ({
      ...aco,
      SAVINGS_RATE_YOY: null,
      QUALITY_SCORE_YOY: null,
    }));

    return rankings.map(aco => {
      const prevAco = prevYearData.rankings.find(p => p.ACO_ID === aco.ACO_ID);

      return {
        ...aco,
        PREV_SAVINGS_RATE_PCT: prevAco?.SAVINGS_RATE_PCT,
        PREV_QUALITY_SCORE: prevAco?.QUALITY_SCORE,
        SAVINGS_RATE_YOY: prevAco ? aco.SAVINGS_RATE_PCT - prevAco.SAVINGS_RATE_PCT : null,
        QUALITY_SCORE_YOY: prevAco ? (aco.QUALITY_SCORE || 0) - (prevAco.QUALITY_SCORE || 0) : null,
      };
    });
  }, [rankings, prevYearData]);

  // Client-side filtering and sorting
  const filteredAndSortedRankings = useMemo(() => {
    let filtered = rankingsWithYoY;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(aco =>
        aco.ACO_NAME.toLowerCase().includes(searchTerm.toLowerCase()) ||
        aco.ACO_STATE.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // FQHC has filter
    if (hasFQHCs !== undefined) {
      filtered = filtered.filter(aco => {
        const hasF = (aco.NUM_FQHCS || 0) > 0;
        return hasF === hasFQHCs;
      });
    }

    // FQHC percentage filter
    if (minFQHCPct !== undefined || maxFQHCPct !== undefined) {
      filtered = filtered.filter(aco => {
        const totalProviders = (aco.NUM_PCPS || 0) + (aco.NUM_SPECIALISTS || 0) + (aco.NUM_FQHCS || 0) + (aco.NUM_RHCS || 0);
        if (totalProviders === 0) return false;

        const fqhcPct = ((aco.NUM_FQHCS || 0) / totalProviders) * 100;

        if (minFQHCPct !== undefined && fqhcPct < minFQHCPct) return false;
        if (maxFQHCPct !== undefined && fqhcPct > maxFQHCPct) return false;

        return true;
      });
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      const aVal = a[sortColumn as keyof typeof a];
      const bVal = b[sortColumn as keyof typeof b];

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
  }, [rankingsWithYoY, searchTerm, sortColumn, sortDirection, hasFQHCs, minFQHCPct, maxFQHCPct]);

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

  const clearSearch = () => {
    setSearchTerm('');
  };

  return (
    <div>
      {/* Year Selector */}
      {years.length > 0 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Performance Year
          </label>
          <select
            value={selectedYear}
            onChange={(e) => onYearChange(Number(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            {years.map(year => (
              <option key={year} value={year}>
                PY {year}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm text-gray-600">Total ACOs</p>
              <p className="text-2xl font-bold">{summary.TOTAL_ACOS || 0}</p>
            </div>
            <BarChart className="h-8 w-8 text-blue-500" />
          </div>
          <YoYIndicatorComponent
            yoy={acosYoY}
            label={`PY${prevYear}`}
            formatValue={(val) => `${val > 0 ? '+' : ''}${val.toFixed(0)} ACOs`}
          />
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm text-gray-600">Total Beneficiaries</p>
              <p className="text-2xl font-bold">
                {(summary.TOTAL_BENEFICIARIES || 0).toLocaleString()}
              </p>
            </div>
            <Users className="h-8 w-8 text-green-500" />
          </div>
          <YoYIndicatorComponent
            yoy={beneficiariesYoY}
            label={`PY${prevYear}`}
            formatValue={(val) => `${val > 0 ? '+' : ''}${val.toLocaleString()}`}
          />
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm text-gray-600">Avg Savings Rate</p>
              <p className="text-2xl font-bold">
                {(summary.AVG_SAVINGS_RATE_PCT || 0).toFixed(2)}%
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-500" />
          </div>
          <YoYIndicatorComponent
            yoy={savingsRateYoY}
            label={`PY${prevYear}`}
            formatValue={(val) => `${val > 0 ? '+' : ''}${val.toFixed(2)}pp`}
          />
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm text-gray-600">Total Savings</p>
              <p className="text-2xl font-bold">
                ${((summary.TOTAL_SAVINGS_LOSSES || 0) / 1000000).toFixed(1)}M
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-yellow-500" />
          </div>
          <YoYIndicatorComponent
            yoy={totalSavingsYoY}
            label={`PY${prevYear}`}
            formatValue={(val) => `${val > 0 ? '+' : ''}$${(val / 1000000).toFixed(1)}M`}
          />
        </div>
      </div>

      {/* Top ACOs Table */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Top Performing ACOs</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              {showFilters ? 'Hide' : 'Show'} FQHC Filters
            </button>
            <div className="relative">
              <input
                type="text"
                placeholder="Search ACOs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* FQHC Filter Panel */}
        {showFilters && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Has FQHCs Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Includes FQHCs
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setHasFQHCs(hasFQHCs === true ? undefined : true)}
                    className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                      hasFQHCs === true
                        ? 'bg-green-600 text-white border-green-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-green-400'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setHasFQHCs(hasFQHCs === false ? undefined : false)}
                    className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                      hasFQHCs === false
                        ? 'bg-red-600 text-white border-red-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-red-400'
                    }`}
                  >
                    No
                  </button>
                  {hasFQHCs !== undefined && (
                    <button
                      onClick={() => setHasFQHCs(undefined)}
                      className="px-3 py-1 text-xs rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100"
                    >
                      Any
                    </button>
                  )}
                </div>
              </div>

              {/* FQHC Percentage Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  FQHC % of Network
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Min %"
                    min="0"
                    max="100"
                    value={minFQHCPct || ''}
                    onChange={(e) => setMinFQHCPct(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Max %"
                    min="0"
                    max="100"
                    value={maxFQHCPct || ''}
                    onChange={(e) => setMaxFQHCPct(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Clear Filters Button */}
            {(hasFQHCs !== undefined || minFQHCPct !== undefined || maxFQHCPct !== undefined) && (
              <div className="mt-3 pt-3 border-t">
                <button
                  onClick={() => {
                    setHasFQHCs(undefined);
                    setMinFQHCPct(undefined);
                    setMaxFQHCPct(undefined);
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700 underline"
                >
                  Clear FQHC filters
                </button>
              </div>
            )}
          </div>
        )}
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
                <tr
                  key={aco.ACO_ID}
                  className="border-b hover:bg-gray-50 cursor-pointer"
                  onClick={() => onACOClick?.(aco.ACO_ID)}
                >
                  <td className="py-3 px-4">{index + 1}</td>
                  <td className="py-3 px-4">{aco.ACO_NAME}</td>
                  <td className="py-3 px-4">{aco.ACO_STATE}</td>
                  <td className="py-3 px-4">{aco.ACO_TRACK}</td>
                  <td className="py-3 px-4 text-right">
                    {aco.TOTAL_BENEFICIARIES?.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex flex-col items-end">
                      <span>{aco.SAVINGS_RATE_PCT?.toFixed(2)}%</span>
                      {aco.SAVINGS_RATE_YOY !== null && (
                        <span className={`text-xs ${
                          aco.SAVINGS_RATE_YOY > 0 ? 'text-green-600' :
                          aco.SAVINGS_RATE_YOY < 0 ? 'text-red-600' : 'text-gray-500'
                        }`}>
                          {aco.SAVINGS_RATE_YOY > 0 ? '↑' : aco.SAVINGS_RATE_YOY < 0 ? '↓' : '—'}
                          {Math.abs(aco.SAVINGS_RATE_YOY).toFixed(2)}pp
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex flex-col items-end">
                      <span>{aco.QUALITY_SCORE?.toFixed(1) || "N/A"}</span>
                      {aco.QUALITY_SCORE_YOY !== null && aco.QUALITY_SCORE !== null && (
                        <span className={`text-xs ${
                          aco.QUALITY_SCORE_YOY > 0 ? 'text-green-600' :
                          aco.QUALITY_SCORE_YOY < 0 ? 'text-red-600' : 'text-gray-500'
                        }`}>
                          {aco.QUALITY_SCORE_YOY > 0 ? '↑' : aco.QUALITY_SCORE_YOY < 0 ? '↓' : '—'}
                          {Math.abs(aco.QUALITY_SCORE_YOY).toFixed(1)}
                        </span>
                      )}
                    </div>
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
  );
}
