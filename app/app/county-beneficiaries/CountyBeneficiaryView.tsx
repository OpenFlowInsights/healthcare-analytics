"use client";

import { useState, useMemo } from 'react';
import { MapPin, Users, TrendingUp, Building2, X } from "lucide-react";
import type { CountyBeneficiaryDashboardData, CountyBeneficiary } from '@/lib/data/aco';

interface CountyBeneficiaryViewProps {
  data: CountyBeneficiaryDashboardData;
}

export function CountyBeneficiaryView({ data }: CountyBeneficiaryViewProps) {
  const { years, dataByYear, buildTimestamp } = data;

  const [selectedYear, setSelectedYear] = useState<number>(years[0] || 2024);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string>('TOT_AB');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showAll, setShowAll] = useState(false);

  const currentYearData = dataByYear[selectedYear] || [];

  // Get unique states
  const states = useMemo(() => {
    return Array.from(new Set(currentYearData.map(row => row.STATE_NAME)))
      .sort();
  }, [currentYearData]);

  // Calculate state-level summary
  const stateSummary = useMemo(() => {
    const summary = new Map<string, {
      stateName: string;
      stateId: string;
      totalBeneficiaries: number;
      totalCounties: number;
      acoCount: number;
    }>();

    currentYearData.forEach(row => {
      const existing = summary.get(row.STATE_NAME) || {
        stateName: row.STATE_NAME,
        stateId: row.STATE_ID,
        totalBeneficiaries: 0,
        totalCounties: 0,
        acoCount: 0,
      };

      existing.totalBeneficiaries += row.TOT_AB || 0;
      existing.totalCounties = currentYearData.filter(r => r.STATE_NAME === row.STATE_NAME).length;
      existing.acoCount = new Set(currentYearData.filter(r => r.STATE_NAME === row.STATE_NAME).map(r => r.ACO_ID)).size;

      summary.set(row.STATE_NAME, existing);
    });

    return Array.from(summary.values()).sort((a, b) => b.totalBeneficiaries - a.totalBeneficiaries);
  }, [currentYearData]);

  // Overall statistics
  const totalStats = useMemo(() => {
    return {
      totalBeneficiaries: currentYearData.reduce((sum, row) => sum + (row.TOT_AB || 0), 0),
      totalCounties: new Set(currentYearData.map(row => `${row.STATE_ID}-${row.COUNTY_ID}`)).size,
      totalStates: states.length,
      totalACOs: new Set(currentYearData.map(row => row.ACO_ID)).size,
    };
  }, [currentYearData, states.length]);

  // Filter and sort county data
  const filteredAndSortedData = useMemo(() => {
    let filtered = currentYearData;

    // Filter by selected state
    if (selectedState) {
      filtered = filtered.filter(row => row.STATE_NAME === selectedState);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(row =>
        row.COUNTY_NAME.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.STATE_NAME.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.ACO_ID.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      const aVal = a[sortColumn as keyof CountyBeneficiary];
      const bVal = b[sortColumn as keyof CountyBeneficiary];

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
  }, [currentYearData, selectedState, searchTerm, sortColumn, sortDirection]);

  const displayedData = showAll ? filteredAndSortedData : filteredAndSortedData.slice(0, 100);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const buildDate = new Date(buildTimestamp);
  const formattedDate = buildDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ACO Beneficiaries by County</h1>
          <p className="text-sm text-gray-600 mt-1">
            Medicare FFS members enrolled in MSSP ACOs by geographic location
          </p>
        </div>
        <div className="text-sm text-gray-500">
          Data as of: {formattedDate}
        </div>
      </div>

      {/* Year Selector */}
      <div className="bg-white rounded-lg shadow p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Performance Year
        </label>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="px-4 py-2 border border-gray-300 rounded-lg bg-white"
        >
          {years.map(year => (
            <option key={year} value={year}>
              PY {year}
            </option>
          ))}
        </select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm text-gray-600">Total Beneficiaries</p>
              <p className="text-2xl font-bold text-blue-600">
                {totalStats.totalBeneficiaries.toLocaleString()}
              </p>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm text-gray-600">Counties Covered</p>
              <p className="text-2xl font-bold text-green-600">
                {totalStats.totalCounties}
              </p>
            </div>
            <MapPin className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm text-gray-600">States</p>
              <p className="text-2xl font-bold text-purple-600">
                {totalStats.totalStates}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm text-gray-600">Total ACOs</p>
              <p className="text-2xl font-bold text-orange-600">
                {totalStats.totalACOs}
              </p>
            </div>
            <Building2 className="h-8 w-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* State Summary Table */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Summary by State</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">State</th>
                <th className="text-right py-3 px-4">Total Beneficiaries</th>
                <th className="text-right py-3 px-4">Counties</th>
                <th className="text-right py-3 px-4">ACOs</th>
                <th className="text-center py-3 px-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {stateSummary.slice(0, 10).map(state => (
                <tr
                  key={state.stateId}
                  className="border-b hover:bg-gray-50"
                >
                  <td className="py-3 px-4 font-medium">{state.stateName}</td>
                  <td className="py-3 px-4 text-right">
                    {state.totalBeneficiaries.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right">{state.totalCounties}</td>
                  <td className="py-3 px-4 text-right">{state.acoCount}</td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => setSelectedState(
                        selectedState === state.stateName ? null : state.stateName
                      )}
                      className={`px-3 py-1 text-xs rounded-full transition-colors ${
                        selectedState === state.stateName
                          ? 'bg-blue-600 text-white'
                          : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      }`}
                    >
                      {selectedState === state.stateName ? 'Clear' : 'View Counties'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* County Detail Table */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">
            County Detail {selectedState && `- ${selectedState}`}
          </h2>
          <div className="flex items-center gap-3">
            {selectedState && (
              <button
                onClick={() => setSelectedState(null)}
                className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Clear State Filter
              </button>
            )}
            <div className="relative">
              <input
                type="text"
                placeholder="Search county, state, or ACO..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th
                  className="text-left py-3 px-4 cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('STATE_NAME')}
                >
                  State {sortColumn === 'STATE_NAME' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className="text-left py-3 px-4 cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('COUNTY_NAME')}
                >
                  County {sortColumn === 'COUNTY_NAME' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="text-left py-3 px-4">ACO ID</th>
                <th
                  className="text-right py-3 px-4 cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('TOT_AB')}
                >
                  Total Beneficiaries {sortColumn === 'TOT_AB' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className="text-right py-3 px-4 cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('TOT_AB_PSN_YRS')}
                >
                  Person-Years {sortColumn === 'TOT_AB_PSN_YRS' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
              </tr>
            </thead>
            <tbody>
              {displayedData.map((row, index) => (
                <tr
                  key={`${row.ACO_ID}-${row.COUNTY_ID}-${index}`}
                  className="border-b hover:bg-gray-50"
                >
                  <td className="py-3 px-4">{row.STATE_NAME}</td>
                  <td className="py-3 px-4 font-medium">{row.COUNTY_NAME}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{row.ACO_ID}</td>
                  <td className="py-3 px-4 text-right font-semibold">
                    {(row.TOT_AB || 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {(row.TOT_AB_PSN_YRS || 0).toLocaleString(undefined, {
                      maximumFractionDigits: 1
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAndSortedData.length > 100 && (
          <div className="mt-4 text-center">
            <button
              onClick={() => setShowAll(!showAll)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {showAll
                ? 'Show Top 100'
                : `Show All ${filteredAndSortedData.length.toLocaleString()} Counties`}
            </button>
          </div>
        )}

        {searchTerm && filteredAndSortedData.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No counties found matching &quot;{searchTerm}&quot;
          </div>
        )}
      </div>
    </div>
  );
}
