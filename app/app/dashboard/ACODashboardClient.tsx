"use client";

import { useState, useMemo } from 'react';
import Navigation from "@/components/Navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Filter, X } from 'lucide-react';
import type { MultiYearDashboardData, ACORanking } from '@/lib/data/aco';
import { PerformanceView } from './PerformanceView';
import { ComparisonView } from './ComparisonView';
import { ParticipantsView } from './ParticipantsView';
import { SNFWaiverView } from './SNFWaiverView';
import { calculateCompositeRiskScore } from '@/lib/utils/riskAdjustment';

interface ACODashboardClientProps {
  data: MultiYearDashboardData;
}

interface GlobalFilters {
  tracks: string[];
  acoOwners: string[];
  hasFQHCs?: boolean;
  isLowRevenue?: boolean;
}

type ViewType = 'performance' | 'comparison' | 'participants' | 'snf-waiver';

export function ACODashboardClient({ data }: ACODashboardClientProps) {
  const { years, dataByYear, buildTimestamp } = data;

  // View and year state
  const [activeView, setActiveView] = useState<ViewType>('performance');
  const [isAllYears, setIsAllYears] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number>(years[0] || 2023);
  const [preselectedACOId, setPreselectedACOId] = useState<string | undefined>();

  // Global filters
  const [showFilters, setShowFilters] = useState(false);
  const [globalFilters, setGlobalFilters] = useState<GlobalFilters>({
    tracks: [],
    acoOwners: [],
  });

  // Risk adjustment toggle
  const [isRiskAdjusted, setIsRiskAdjusted] = useState(false);

  // Get all ACOs across all years for filter options
  const allACOsAllYears = useMemo(() => {
    const acosMap = new Map<string, ACORanking>();
    years.forEach(year => {
      dataByYear[year]?.rankings.forEach(aco => {
        if (!acosMap.has(aco.ACO_ID)) {
          acosMap.set(aco.ACO_ID, aco);
        }
      });
    });
    return Array.from(acosMap.values());
  }, [years, dataByYear]);

  // Get unique values for global filters
  const availableTracks = useMemo(() => {
    return Array.from(new Set(allACOsAllYears.map(aco => aco.ACO_TRACK).filter(Boolean))).sort();
  }, [allACOsAllYears]);

  const availableAcoOwners = useMemo(() => {
    return Array.from(new Set(allACOsAllYears.map(aco => aco.ACO_OWNER).filter((owner): owner is string => Boolean(owner)))).sort();
  }, [allACOsAllYears]);

  // Apply global filters to data
  const filteredData = useMemo(() => {
    const filtered: MultiYearDashboardData = {
      years,
      dataByYear: {},
      buildTimestamp,
    };

    years.forEach(year => {
      const yearData = dataByYear[year];
      if (!yearData) return;

      let filteredRankings = yearData.rankings;

      // Apply track filter
      if (globalFilters.tracks.length > 0) {
        filteredRankings = filteredRankings.filter(aco =>
          globalFilters.tracks.includes(aco.ACO_TRACK)
        );
      }

      // Apply ACO owner filter
      if (globalFilters.acoOwners.length > 0) {
        filteredRankings = filteredRankings.filter(aco =>
          aco.ACO_OWNER && globalFilters.acoOwners.includes(aco.ACO_OWNER)
        );
      }

      // Apply FQHC filter
      if (globalFilters.hasFQHCs !== undefined) {
        filteredRankings = filteredRankings.filter(aco => {
          const hasFQHCs = (aco.NUM_FQHCS || 0) > 0;
          return hasFQHCs === globalFilters.hasFQHCs;
        });
      }

      // Apply low revenue filter (ACOs with beneficiaries < 10,000)
      if (globalFilters.isLowRevenue !== undefined) {
        filteredRankings = filteredRankings.filter(aco => {
          const isLowRev = (aco.TOTAL_BENEFICIARIES || 0) < 10000;
          return isLowRev === globalFilters.isLowRevenue;
        });
      }

      filtered.dataByYear[year] = {
        summary: yearData.summary,
        rankings: filteredRankings,
      };
    });

    return filtered;
  }, [years, dataByYear, buildTimestamp, globalFilters]);

  // Enrich data with composite risk scores
  const enrichedData = useMemo(() => {
    const enriched: MultiYearDashboardData = {
      years: filteredData.years,
      buildTimestamp: filteredData.buildTimestamp,
      dataByYear: {},
    };

    filteredData.years.forEach(year => {
      const yearData = filteredData.dataByYear[year];
      if (!yearData) return;

      enriched.dataByYear[year] = {
        summary: yearData.summary,
        rankings: yearData.rankings.map(aco => ({
          ...aco,
          COMPOSITE_RISK_SCORE: calculateCompositeRiskScore(aco),
        })),
      };
    });

    return enriched;
  }, [filteredData]);

  // Combined rankings for "All Years" view
  const combinedRankings = useMemo(() => {
    if (!isAllYears) return [];

    const allRankings: ACORanking[] = [];
    years.forEach(year => {
      const yearData = enrichedData.dataByYear[year];
      if (yearData) {
        allRankings.push(...yearData.rankings);
      }
    });
    return allRankings;
  }, [isAllYears, years, enrichedData]);

  // Handle ACO click from Performance view
  const handleACOClick = (acoId: string) => {
    setPreselectedACOId(acoId);
    setActiveView('comparison');
  };

  // Handle year change
  const handleYearChange = (year: number | 'all') => {
    if (year === 'all') {
      setIsAllYears(true);
      setSelectedYear(years[0]);
    } else {
      setIsAllYears(false);
      setSelectedYear(year);
    }
  };

  // Toggle filter functions
  const toggleTrackFilter = (track: string) => {
    setGlobalFilters(prev => ({
      ...prev,
      tracks: prev.tracks.includes(track)
        ? prev.tracks.filter(t => t !== track)
        : [...prev.tracks, track],
    }));
  };

  const toggleAcoOwnerFilter = (owner: string) => {
    setGlobalFilters(prev => ({
      ...prev,
      acoOwners: prev.acoOwners.includes(owner)
        ? prev.acoOwners.filter(o => o !== owner)
        : [...prev.acoOwners, owner],
    }));
  };

  const clearFilters = () => {
    setGlobalFilters({
      tracks: [],
      acoOwners: [],
      hasFQHCs: undefined,
      isLowRevenue: undefined,
    });
  };

  const hasActiveFilters = globalFilters.tracks.length > 0 ||
    globalFilters.acoOwners.length > 0 ||
    globalFilters.hasFQHCs !== undefined ||
    globalFilters.isLowRevenue !== undefined;

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

  const tabs = [
    { id: 'performance' as ViewType, label: 'ACO Performance', description: 'Rankings & KPIs' },
    { id: 'comparison' as ViewType, label: 'ACO Comparison', description: 'Peer Benchmarking' },
    { id: 'participants' as ViewType, label: 'ACO Participants', description: 'Provider Roster' },
    { id: 'snf-waiver' as ViewType, label: 'SNF Waiver Analysis', description: 'Waiver Impact' },
  ];

  return (
    <div>
      <Navigation />
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <Breadcrumbs
            items={[
              { label: 'Dashboards', href: '/dashboards' },
              { label: 'ACO Performance Dashboard' },
            ]}
          />

          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">Healthcare Analytics Dashboard</h1>
              <p className="text-sm text-gray-500 mt-1">MSSP ACO Performance Analysis</p>
            </div>
            <div className="text-sm text-gray-500">
              Data as of: {formattedDate}
            </div>
          </div>

          {/* Global Filters Bar */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="flex flex-wrap items-center gap-4">
              {/* Year Selector */}
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Performance Year</label>
                <select
                  value={isAllYears ? 'all' : selectedYear}
                  onChange={(e) => handleYearChange(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                  className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium"
                >
                  <option value="all">All Years</option>
                  {years.map(year => (
                    <option key={year} value={year}>
                      PY {year}
                    </option>
                  ))}
                </select>
              </div>

              {/* Risk Adjustment Toggle */}
              <div className="flex items-end">
                <button
                  onClick={() => setIsRiskAdjusted(!isRiskAdjusted)}
                  className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${
                    isRiskAdjusted
                      ? "bg-purple-600 text-white border-purple-600"
                      : "bg-white text-gray-700 border-gray-300 hover:border-purple-400"
                  }`}
                  title="Normalize metrics by HCC risk scores for fair comparisons between ACOs"
                >
                  {isRiskAdjusted && <span className="text-xs">✓</span>}
                  Risk Adjustment
                </button>
              </div>

              {/* Filter Toggle Button */}
              <div className="flex items-end">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-sm font-medium"
                >
                  <Filter className="h-4 w-4" />
                  Filters
                  {hasActiveFilters && (
                    <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-0.5">
                      {globalFilters.tracks.length + globalFilters.acoOwners.length + (globalFilters.hasFQHCs !== undefined ? 1 : 0) + (globalFilters.isLowRevenue !== undefined ? 1 : 0)}
                    </span>
                  )}
                </button>
              </div>

              {/* Clear Filters Button */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 px-3 py-2 text-sm text-blue-600 hover:text-blue-700 underline"
                >
                  <X className="h-3 w-3" />
                  Clear all filters
                </button>
              )}

              {/* Active Filter Pills */}
              <div className="flex flex-wrap gap-2">
                {globalFilters.tracks.map(track => (
                  <span key={track} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    Track: {track}
                    <button onClick={() => toggleTrackFilter(track)} className="hover:bg-blue-200 rounded-full p-0.5">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                {globalFilters.acoOwners.map(owner => (
                  <span key={owner} className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                    Owner: {owner}
                    <button onClick={() => toggleAcoOwnerFilter(owner)} className="hover:bg-purple-200 rounded-full p-0.5">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                {globalFilters.hasFQHCs !== undefined && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    FQHC: {globalFilters.hasFQHCs ? 'Yes' : 'No'}
                    <button onClick={() => setGlobalFilters(prev => ({ ...prev, hasFQHCs: undefined }))} className="hover:bg-green-200 rounded-full p-0.5">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {globalFilters.isLowRevenue !== undefined && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                    Low Revenue: {globalFilters.isLowRevenue ? 'Yes' : 'No'}
                    <button onClick={() => setGlobalFilters(prev => ({ ...prev, isLowRevenue: undefined }))} className="hover:bg-orange-200 rounded-full p-0.5">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
              </div>
            </div>

            {/* Filter Panel */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Track Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Track</label>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                    {availableTracks.map(track => (
                      <button
                        key={track}
                        onClick={() => toggleTrackFilter(track)}
                        className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                          globalFilters.tracks.includes(track)
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                        }`}
                      >
                        {track}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ACO Owner Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ACO Owner</label>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                    {availableAcoOwners.length > 0 ? (
                      availableAcoOwners.map(owner => (
                        <button
                          key={owner}
                          onClick={() => toggleAcoOwnerFilter(owner)}
                          className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                            globalFilters.acoOwners.includes(owner)
                              ? 'bg-purple-600 text-white border-purple-600'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-purple-400'
                          }`}
                        >
                          {owner}
                        </button>
                      ))
                    ) : (
                      <span className="text-xs text-gray-500">No data available</span>
                    )}
                  </div>
                </div>

                {/* FQHC Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">FQHC Participation</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setGlobalFilters(prev => ({
                        ...prev,
                        hasFQHCs: prev.hasFQHCs === true ? undefined : true,
                      }))}
                      className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                        globalFilters.hasFQHCs === true
                          ? 'bg-green-600 text-white border-green-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-green-400'
                      }`}
                    >
                      Has FQHCs
                    </button>
                    <button
                      onClick={() => setGlobalFilters(prev => ({
                        ...prev,
                        hasFQHCs: prev.hasFQHCs === false ? undefined : false,
                      }))}
                      className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                        globalFilters.hasFQHCs === false
                          ? 'bg-red-600 text-white border-red-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-red-400'
                      }`}
                    >
                      No FQHCs
                    </button>
                  </div>
                </div>

                {/* Low Revenue Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Revenue Size</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setGlobalFilters(prev => ({
                        ...prev,
                        isLowRevenue: prev.isLowRevenue === true ? undefined : true,
                      }))}
                      className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                        globalFilters.isLowRevenue === true
                          ? 'bg-orange-600 text-white border-orange-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-orange-400'
                      }`}
                    >
                      Low (&lt;10K)
                    </button>
                    <button
                      onClick={() => setGlobalFilters(prev => ({
                        ...prev,
                        isLowRevenue: prev.isLowRevenue === false ? undefined : false,
                      }))}
                      className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                        globalFilters.isLowRevenue === false
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                      }`}
                    >
                      High (&gt;=10K)
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Based on beneficiary count</p>
                </div>
              </div>
            )}
          </div>

          {/* Risk Adjustment Indicator Badge */}
          {isRiskAdjusted && (
            <div className="mb-4 px-4 py-2 bg-purple-50 border border-purple-200 rounded-lg flex items-center gap-2">
              <span className="text-purple-700 font-medium">Risk Adjusted Metrics</span>
              <span className="text-purple-600 text-sm">
                Normalized by HCC risk scores
              </span>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="mb-6 border-b border-gray-200">
            <nav className="flex space-x-8" aria-label="Tabs">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveView(tab.id)}
                  className={`
                    py-4 px-1 border-b-2 font-medium text-sm transition-colors
                    ${activeView === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <div>{tab.label}</div>
                  <div className="text-xs text-gray-400">{tab.description}</div>
                </button>
              ))}
            </nav>
          </div>

          {/* View Content */}
          <div className="mt-6">
            {activeView === 'performance' && (
              <PerformanceView
                data={enrichedData}
                selectedYear={selectedYear}
                isAllYears={isAllYears}
                combinedRankings={combinedRankings}
                onYearChange={(year) => handleYearChange(year)}
                onACOClick={handleACOClick}
                isRiskAdjusted={isRiskAdjusted}
              />
            )}

            {activeView === 'comparison' && (
              <ComparisonView
                data={enrichedData}
                selectedYear={selectedYear}
                onYearChange={(year) => handleYearChange(year)}
                preselectedACOId={preselectedACOId}
                isRiskAdjusted={isRiskAdjusted}
              />
            )}

            {activeView === 'participants' && (
              <ParticipantsView
                data={enrichedData}
                selectedYear={selectedYear}
                onYearChange={(year) => handleYearChange(year)}
              />
            )}

            {activeView === 'snf-waiver' && (
              <SNFWaiverView
                data={enrichedData}
                selectedYear={selectedYear}
                onYearChange={(year) => handleYearChange(year)}
                isRiskAdjusted={isRiskAdjusted}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
