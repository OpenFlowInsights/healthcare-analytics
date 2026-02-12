"use client";

import { useState, useMemo } from 'react';
import { Search, X, Filter, TrendingUp, TrendingDown } from 'lucide-react';
import type { MultiYearDashboardData, ACORanking } from '@/lib/data/aco';

interface ComparisonViewProps {
  data: MultiYearDashboardData;
  selectedYear: number;
  onYearChange: (year: number) => void;
  preselectedACOId?: string;
}

interface Filters {
  tracks: string[];
  states: string[];
  minBeneficiaries?: number;
  maxBeneficiaries?: number;
  hasFQHCs?: boolean;
  minFQHCPct?: number;
  maxFQHCPct?: number;
}

interface ComparisonMetric {
  label: string;
  focusValue: number;
  groupMean: number;
  groupMedian: number;
  percentile: number;
  unit?: string;
}

export function ComparisonView({ data, selectedYear, onYearChange, preselectedACOId }: ComparisonViewProps) {
  const { years, dataByYear } = data;
  const currentYearData = dataByYear[selectedYear];
  const allACOs = currentYearData?.rankings || [];

  // State
  const [selectedACOId, setSelectedACOId] = useState<string | undefined>(preselectedACOId);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    tracks: [],
    states: [],
  });

  // Get unique values for filters
  const availableTracks = useMemo(() => {
    return Array.from(new Set(allACOs.map(aco => aco.ACO_TRACK).filter(Boolean))).sort();
  }, [allACOs]);

  const availableStates = useMemo(() => {
    return Array.from(new Set(allACOs.map(aco => aco.ACO_STATE).filter(Boolean))).sort();
  }, [allACOs]);

  // Find selected ACO
  const focusACO = allACOs.find(aco => aco.ACO_ID === selectedACOId);

  // Filter ACOs for search
  const searchedACOs = useMemo(() => {
    if (!searchTerm) return allACOs;

    return allACOs.filter(aco =>
      aco.ACO_NAME.toLowerCase().includes(searchTerm.toLowerCase()) ||
      aco.ACO_ID.toLowerCase().includes(searchTerm.toLowerCase()) ||
      aco.ACO_STATE.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allACOs, searchTerm]);

  // Apply filters to create comparison group (excluding focus ACO)
  const comparisonGroup = useMemo(() => {
    let filtered = allACOs.filter(aco => aco.ACO_ID !== selectedACOId);

    // Track filter
    if (filters.tracks.length > 0) {
      filtered = filtered.filter(aco => filters.tracks.includes(aco.ACO_TRACK));
    }

    // State filter
    if (filters.states.length > 0) {
      filtered = filtered.filter(aco => filters.states.includes(aco.ACO_STATE));
    }

    // Beneficiary count filter
    if (filters.minBeneficiaries !== undefined) {
      filtered = filtered.filter(aco => aco.TOTAL_BENEFICIARIES >= filters.minBeneficiaries!);
    }
    if (filters.maxBeneficiaries !== undefined) {
      filtered = filtered.filter(aco => aco.TOTAL_BENEFICIARIES <= filters.maxBeneficiaries!);
    }

    // FQHC filters
    if (filters.hasFQHCs !== undefined) {
      filtered = filtered.filter(aco => {
        const hasFQHCs = (aco.NUM_FQHCS || 0) > 0;
        return hasFQHCs === filters.hasFQHCs;
      });
    }

    // FQHC percentage filter
    if (filters.minFQHCPct !== undefined || filters.maxFQHCPct !== undefined) {
      filtered = filtered.filter(aco => {
        const totalProviders = (aco.NUM_PCPS || 0) + (aco.NUM_SPECIALISTS || 0) + (aco.NUM_FQHCS || 0) + (aco.NUM_RHCS || 0);
        if (totalProviders === 0) return false;

        const fqhcPct = ((aco.NUM_FQHCS || 0) / totalProviders) * 100;

        if (filters.minFQHCPct !== undefined && fqhcPct < filters.minFQHCPct) return false;
        if (filters.maxFQHCPct !== undefined && fqhcPct > filters.maxFQHCPct) return false;

        return true;
      });
    }

    return filtered;
  }, [allACOs, selectedACOId, filters]);

  // Calculate statistics for a metric
  const calculateStats = (getValue: (aco: ACORanking) => number | null): ComparisonMetric | null => {
    if (!focusACO) return null;

    const focusValue = getValue(focusACO);
    if (focusValue === null) return null;

    const values = comparisonGroup
      .map(getValue)
      .filter((v): v is number => v !== null)
      .sort((a, b) => a - b);

    if (values.length === 0) return null;

    const groupMean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const groupMedian = values[Math.floor(values.length / 2)];

    // Calculate percentile
    const rank = values.filter(v => v <= focusValue).length;
    const percentile = (rank / values.length) * 100;

    return {
      label: '',
      focusValue,
      groupMean,
      groupMedian,
      percentile,
    };
  };

  // Comparison metrics
  const savingsRateStats = useMemo(() =>
    calculateStats(aco => aco.SAVINGS_RATE_PCT),
    [focusACO, comparisonGroup]
  );

  const qualityScoreStats = useMemo(() =>
    calculateStats(aco => aco.QUALITY_SCORE),
    [focusACO, comparisonGroup]
  );

  const beneficiariesStats = useMemo(() =>
    calculateStats(aco => aco.TOTAL_BENEFICIARIES),
    [focusACO, comparisonGroup]
  );

  // Enhanced metrics - Utilization
  const edVisitsStats = useMemo(() =>
    calculateStats(aco => aco.ED_VISITS_PER_1K || null),
    [focusACO, comparisonGroup]
  );

  const pcpVisitsStats = useMemo(() =>
    calculateStats(aco => aco.PCP_VISITS_PER_1K || null),
    [focusACO, comparisonGroup]
  );

  const specialistVisitsStats = useMemo(() =>
    calculateStats(aco => aco.SPECIALIST_VISITS_PER_1K || null),
    [focusACO, comparisonGroup]
  );

  const readmissionStats = useMemo(() =>
    calculateStats(aco => aco.READMISSION_RATE_PER_1000 || null),
    [focusACO, comparisonGroup]
  );

  const snfAdmissionsStats = useMemo(() =>
    calculateStats(aco => aco.SNF_ADMISSIONS_PER_1K || null),
    [focusACO, comparisonGroup]
  );

  // Toggle filter
  const toggleFilter = (type: 'track' | 'state', value: string) => {
    if (type === 'track') {
      setFilters(prev => ({
        ...prev,
        tracks: prev.tracks.includes(value)
          ? prev.tracks.filter(t => t !== value)
          : [...prev.tracks, value],
      }));
    } else {
      setFilters(prev => ({
        ...prev,
        states: prev.states.includes(value)
          ? prev.states.filter(s => s !== value)
          : [...prev.states, value],
      }));
    }
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      tracks: [],
      states: [],
      hasFQHCs: undefined,
      minFQHCPct: undefined,
      maxFQHCPct: undefined,
    });
  };

  // Metric display component
  const MetricCard = ({ title, stats, unit = '%' }: { title: string; stats: ComparisonMetric | null; unit?: string }) => {
    if (!stats) return null;

    const isAboveMedian = stats.focusValue > stats.groupMedian;

    return (
      <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-3">{title}</h4>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Focus ACO</span>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-blue-600">
                {stats.focusValue.toFixed(2)}{unit}
              </span>
              {isAboveMedian ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Group Mean</span>
            <span className="text-sm font-medium">{stats.groupMean.toFixed(2)}{unit}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Group Median</span>
            <span className="text-sm font-medium">{stats.groupMedian.toFixed(2)}{unit}</span>
          </div>

          <div className="mt-3 pt-3 border-t">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-700">Percentile Rank</span>
              <span className="text-sm font-bold text-purple-600">{stats.percentile.toFixed(0)}th</span>
            </div>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all"
                style={{ width: `${stats.percentile}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    );
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

      {/* ACO Selector */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-bold mb-4">Select ACO to Compare</h2>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by ACO name, ID, or state..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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

        {searchTerm && (
          <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg mb-4">
            {searchedACOs.slice(0, 20).map(aco => (
              <button
                key={aco.ACO_ID}
                onClick={() => {
                  setSelectedACOId(aco.ACO_ID);
                  setSearchTerm('');
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-0"
              >
                <div className="font-medium">{aco.ACO_NAME}</div>
                <div className="text-xs text-gray-500">
                  {aco.ACO_ID} • {aco.ACO_STATE} • {aco.ACO_TRACK}
                </div>
              </button>
            ))}
          </div>
        )}

        {focusACO && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Selected ACO:</h3>
            <div className="space-y-1 text-sm">
              <div><span className="font-medium">Name:</span> {focusACO.ACO_NAME}</div>
              <div><span className="font-medium">ID:</span> {focusACO.ACO_ID}</div>
              <div><span className="font-medium">State:</span> {focusACO.ACO_STATE}</div>
              <div><span className="font-medium">Track:</span> {focusACO.ACO_TRACK}</div>
              <div><span className="font-medium">Beneficiaries:</span> {focusACO.TOTAL_BENEFICIARIES?.toLocaleString()}</div>
            </div>
          </div>
        )}
      </div>

      {focusACO && (
        <>
          {/* Filter Panel */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Comparison Group Filters</h2>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <Filter className="h-4 w-4" />
                {showFilters ? 'Hide' : 'Show'} Filters
              </button>
            </div>

            <div className="flex items-center justify-between mb-4 text-sm">
              <span className="font-medium">
                Comparing against <span className="text-blue-600">{comparisonGroup.length}</span> ACOs
              </span>
              {(filters.tracks.length > 0 || filters.states.length > 0 || filters.hasFQHCs !== undefined || filters.minFQHCPct !== undefined || filters.maxFQHCPct !== undefined) && (
                <button
                  onClick={clearFilters}
                  className="text-blue-600 hover:text-blue-700 underline"
                >
                  Clear all filters
                </button>
              )}
            </div>

            {showFilters && (
              <div className="space-y-4 pt-4 border-t">
                {/* Track Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Track</label>
                  <div className="flex flex-wrap gap-2">
                    {availableTracks.map(track => (
                      <button
                        key={track}
                        onClick={() => toggleFilter('track', track)}
                        className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                          filters.tracks.includes(track)
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                        }`}
                      >
                        {track}
                      </button>
                    ))}
                  </div>
                </div>

                {/* State Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                  <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                    {availableStates.map(state => (
                      <button
                        key={state}
                        onClick={() => toggleFilter('state', state)}
                        className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                          filters.states.includes(state)
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                        }`}
                      >
                        {state}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Beneficiary Count Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Beneficiary Count Range
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <input
                        type="number"
                        placeholder="Min"
                        value={filters.minBeneficiaries || ''}
                        onChange={(e) => setFilters(prev => ({
                          ...prev,
                          minBeneficiaries: e.target.value ? Number(e.target.value) : undefined,
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        placeholder="Max"
                        value={filters.maxBeneficiaries || ''}
                        onChange={(e) => setFilters(prev => ({
                          ...prev,
                          maxBeneficiaries: e.target.value ? Number(e.target.value) : undefined,
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* FQHC Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    FQHC Participation
                  </label>
                  <div className="space-y-3">
                    {/* Has FQHCs toggle */}
                    <div className="flex items-center gap-3">
                      <label className="text-sm text-gray-600">Includes FQHCs:</label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setFilters(prev => ({
                            ...prev,
                            hasFQHCs: prev.hasFQHCs === true ? undefined : true,
                          }))}
                          className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                            filters.hasFQHCs === true
                              ? 'bg-green-600 text-white border-green-600'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-green-400'
                          }`}
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setFilters(prev => ({
                            ...prev,
                            hasFQHCs: prev.hasFQHCs === false ? undefined : false,
                          }))}
                          className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                            filters.hasFQHCs === false
                              ? 'bg-red-600 text-white border-red-600'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-red-400'
                          }`}
                        >
                          No
                        </button>
                        {filters.hasFQHCs !== undefined && (
                          <button
                            onClick={() => setFilters(prev => ({ ...prev, hasFQHCs: undefined }))}
                            className="px-3 py-1 text-xs rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100"
                          >
                            Any
                          </button>
                        )}
                      </div>
                    </div>

                    {/* FQHC Percentage Range */}
                    <div>
                      <label className="text-sm text-gray-600 mb-2 block">FQHC % of Network:</label>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <input
                            type="number"
                            placeholder="Min %"
                            min="0"
                            max="100"
                            value={filters.minFQHCPct || ''}
                            onChange={(e) => setFilters(prev => ({
                              ...prev,
                              minFQHCPct: e.target.value ? Number(e.target.value) : undefined,
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                        <div>
                          <input
                            type="number"
                            placeholder="Max %"
                            min="0"
                            max="100"
                            value={filters.maxFQHCPct || ''}
                            onChange={(e) => setFilters(prev => ({
                              ...prev,
                              maxFQHCPct: e.target.value ? Number(e.target.value) : undefined,
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Comparison Metrics */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold mb-6">Performance Comparison</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <MetricCard
                title="Savings Rate"
                stats={savingsRateStats}
                unit="%"
              />
              <MetricCard
                title="Quality Score"
                stats={qualityScoreStats}
                unit=""
              />
              <MetricCard
                title="Assigned Beneficiaries"
                stats={beneficiariesStats}
                unit=""
              />
            </div>

            {comparisonGroup.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No ACOs match the current filter criteria. Try adjusting your filters.
              </div>
            )}
          </div>

          {/* Financial Performance Section */}
          {focusACO && (focusACO.BENCHMARK_EXPENDITURE || focusACO.TOTAL_EXPENDITURE) && (
            <div className="bg-white rounded-lg shadow p-6 mt-6">
              <h2 className="text-lg font-bold mb-6">Financial Performance</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {focusACO.BENCHMARK_EXPENDITURE && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="text-xs text-gray-500 mb-1">Benchmark Expenditure</div>
                    <div className="text-2xl font-bold text-gray-900">
                      ${(focusACO.BENCHMARK_EXPENDITURE / 1000000).toFixed(2)}M
                    </div>
                  </div>
                )}
                {focusACO.TOTAL_EXPENDITURE && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="text-xs text-gray-500 mb-1">Actual Expenditure</div>
                    <div className="text-2xl font-bold text-gray-900">
                      ${(focusACO.TOTAL_EXPENDITURE / 1000000).toFixed(2)}M
                    </div>
                  </div>
                )}
                {focusACO.SAVINGS_LOSSES !== undefined && (
                  <div className={`rounded-lg p-4 border ${
                    focusACO.SAVINGS_LOSSES > 0
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="text-xs text-gray-500 mb-1">Net Savings/Losses</div>
                    <div className={`text-2xl font-bold ${
                      focusACO.SAVINGS_LOSSES > 0 ? 'text-green-700' : 'text-red-700'
                    }`}>
                      ${(Math.abs(focusACO.SAVINGS_LOSSES) / 1000000).toFixed(2)}M
                    </div>
                    <div className="text-xs mt-1">
                      {focusACO.SAVINGS_LOSSES > 0 ? 'Savings' : 'Loss'}
                    </div>
                  </div>
                )}
                {focusACO.COST_PER_BENEFICIARY && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="text-xs text-gray-500 mb-1">Cost Per Beneficiary</div>
                    <div className="text-2xl font-bold text-gray-900">
                      ${focusACO.COST_PER_BENEFICIARY.toLocaleString()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Membership Breakdown Section */}
          {focusACO && (focusACO.AGED_NONDUAL_BENES || focusACO.AGED_DUAL_BENES || focusACO.DISABLED_BENES || focusACO.ESRD_BENES) && (
            <div className="bg-white rounded-lg shadow p-6 mt-6">
              <h2 className="text-lg font-bold mb-6">Membership Breakdown</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {focusACO.AGED_NONDUAL_BENES !== undefined && focusACO.AGED_NONDUAL_BENES > 0 && (
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="text-xs text-blue-700 mb-1">Aged Non-Dual</div>
                    <div className="text-2xl font-bold text-blue-900">
                      {focusACO.AGED_NONDUAL_BENES.toLocaleString()}
                    </div>
                    {focusACO.TOTAL_BENEFICIARIES > 0 && (
                      <div className="text-xs text-blue-600 mt-1">
                        {((focusACO.AGED_NONDUAL_BENES / focusACO.TOTAL_BENEFICIARIES) * 100).toFixed(1)}%
                      </div>
                    )}
                  </div>
                )}
                {focusACO.AGED_DUAL_BENES !== undefined && focusACO.AGED_DUAL_BENES > 0 && (
                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                    <div className="text-xs text-purple-700 mb-1">Aged Dual-Eligible</div>
                    <div className="text-2xl font-bold text-purple-900">
                      {focusACO.AGED_DUAL_BENES.toLocaleString()}
                    </div>
                    {focusACO.TOTAL_BENEFICIARIES > 0 && (
                      <div className="text-xs text-purple-600 mt-1">
                        {((focusACO.AGED_DUAL_BENES / focusACO.TOTAL_BENEFICIARIES) * 100).toFixed(1)}%
                      </div>
                    )}
                  </div>
                )}
                {focusACO.DISABLED_BENES !== undefined && focusACO.DISABLED_BENES > 0 && (
                  <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                    <div className="text-xs text-orange-700 mb-1">Disabled</div>
                    <div className="text-2xl font-bold text-orange-900">
                      {focusACO.DISABLED_BENES.toLocaleString()}
                    </div>
                    {focusACO.TOTAL_BENEFICIARIES > 0 && (
                      <div className="text-xs text-orange-600 mt-1">
                        {((focusACO.DISABLED_BENES / focusACO.TOTAL_BENEFICIARIES) * 100).toFixed(1)}%
                      </div>
                    )}
                  </div>
                )}
                {focusACO.ESRD_BENES !== undefined && focusACO.ESRD_BENES > 0 && (
                  <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                    <div className="text-xs text-red-700 mb-1">ESRD</div>
                    <div className="text-2xl font-bold text-red-900">
                      {focusACO.ESRD_BENES.toLocaleString()}
                    </div>
                    {focusACO.TOTAL_BENEFICIARIES > 0 && (
                      <div className="text-xs text-red-600 mt-1">
                        {((focusACO.ESRD_BENES / focusACO.TOTAL_BENEFICIARIES) * 100).toFixed(1)}%
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Utilization Metrics Section */}
          <div className="bg-white rounded-lg shadow p-6 mt-6">
            <h2 className="text-lg font-bold mb-6">Utilization Metrics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <MetricCard
                title="ED Visits per 1,000"
                stats={edVisitsStats}
                unit=""
              />
              <MetricCard
                title="PCP Visits per 1,000"
                stats={pcpVisitsStats}
                unit=""
              />
              <MetricCard
                title="Specialist Visits per 1,000"
                stats={specialistVisitsStats}
                unit=""
              />
              <MetricCard
                title="Readmissions per 1,000"
                stats={readmissionStats}
                unit=""
              />
              <MetricCard
                title="SNF Admissions per 1,000"
                stats={snfAdmissionsStats}
                unit=""
              />
            </div>
          </div>

          {/* Provider Network Section */}
          {focusACO && (focusACO.NUM_PCPS || focusACO.NUM_SPECIALISTS || focusACO.NUM_FQHCS || focusACO.NUM_RHCS || focusACO.NUM_HOSPITALS) && (
            <div className="bg-white rounded-lg shadow p-6 mt-6">
              <h2 className="text-lg font-bold mb-6">Provider Network Composition</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {focusACO.NUM_PCPS !== undefined && focusACO.NUM_PCPS > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="text-xs text-gray-500 mb-1">Primary Care</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {focusACO.NUM_PCPS.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">PCPs</div>
                  </div>
                )}
                {focusACO.NUM_SPECIALISTS !== undefined && focusACO.NUM_SPECIALISTS > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="text-xs text-gray-500 mb-1">Specialists</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {focusACO.NUM_SPECIALISTS.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">Providers</div>
                  </div>
                )}
                {focusACO.NUM_FQHCS !== undefined && focusACO.NUM_FQHCS > 0 && (
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <div className="text-xs text-green-700 mb-1">FQHCs</div>
                    <div className="text-2xl font-bold text-green-900">
                      {focusACO.NUM_FQHCS.toLocaleString()}
                    </div>
                    <div className="text-xs text-green-600 mt-1">
                      Sites
                      {(() => {
                        const totalProviders = (focusACO.NUM_PCPS || 0) + (focusACO.NUM_SPECIALISTS || 0) + (focusACO.NUM_FQHCS || 0) + (focusACO.NUM_RHCS || 0);
                        if (totalProviders > 0) {
                          const pct = ((focusACO.NUM_FQHCS || 0) / totalProviders * 100).toFixed(1);
                          return ` (${pct}%)`;
                        }
                        return '';
                      })()}
                    </div>
                  </div>
                )}
                {focusACO.NUM_RHCS !== undefined && focusACO.NUM_RHCS > 0 && (
                  <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                    <div className="text-xs text-yellow-700 mb-1">Rural Health</div>
                    <div className="text-2xl font-bold text-yellow-900">
                      {focusACO.NUM_RHCS.toLocaleString()}
                    </div>
                    <div className="text-xs text-yellow-600 mt-1">Clinics</div>
                  </div>
                )}
                {focusACO.NUM_HOSPITALS !== undefined && focusACO.NUM_HOSPITALS > 0 && (
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="text-xs text-blue-700 mb-1">Hospitals</div>
                    <div className="text-2xl font-bold text-blue-900">
                      {focusACO.NUM_HOSPITALS.toLocaleString()}
                    </div>
                    <div className="text-xs text-blue-600 mt-1">Facilities</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {!focusACO && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600">
            Select an ACO above to begin comparison analysis
          </p>
        </div>
      )}
    </div>
  );
}
