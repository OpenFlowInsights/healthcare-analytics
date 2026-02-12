"use client";

import { useState, useMemo } from 'react';
import { Search, X, Building, Users, MapPin, FileText } from 'lucide-react';
import type { MultiYearDashboardData } from '@/lib/data/aco';

interface ParticipantsViewProps {
  data: MultiYearDashboardData;
  selectedYear: number;
  onYearChange: (year: number) => void;
}

// Provider data interface (for when real data is available)
interface Provider {
  TIN: string;
  NPI: string;
  PROVIDER_NAME: string;
  PROVIDER_TYPE: string;
  IS_FQHC: boolean;
  IS_RHC: boolean;
  IS_CAH: boolean;
  CITY: string;
  STATE: string;
  ZIP: string;
}

export function ParticipantsView({ data, selectedYear, onYearChange }: ParticipantsViewProps) {
  const { years, dataByYear } = data;
  const currentYearData = dataByYear[selectedYear];
  const allACOs = currentYearData?.rankings || [];

  // State
  const [selectedACOId, setSelectedACOId] = useState<string | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [providerSearchTerm, setProviderSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string>('PROVIDER_NAME');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Find selected ACO
  const selectedACO = allACOs.find(aco => aco.ACO_ID === selectedACOId);

  // Filter ACOs for search
  const searchedACOs = useMemo(() => {
    if (!searchTerm) return allACOs;

    return allACOs.filter(aco =>
      aco.ACO_NAME.toLowerCase().includes(searchTerm.toLowerCase()) ||
      aco.ACO_ID.toLowerCase().includes(searchTerm.toLowerCase()) ||
      aco.ACO_STATE.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allACOs, searchTerm]);

  // Mock provider data (this would come from the database)
  const mockProviders: Provider[] = [];

  // Filter providers
  const filteredProviders = useMemo(() => {
    if (!providerSearchTerm) return mockProviders;

    return mockProviders.filter(provider =>
      provider.PROVIDER_NAME.toLowerCase().includes(providerSearchTerm.toLowerCase()) ||
      provider.TIN.includes(providerSearchTerm) ||
      provider.NPI.includes(providerSearchTerm) ||
      provider.STATE.toLowerCase().includes(providerSearchTerm.toLowerCase())
    );
  }, [mockProviders, providerSearchTerm]);

  // Sort providers
  const sortedProviders = useMemo(() => {
    return [...filteredProviders].sort((a, b) => {
      const aVal = a[sortColumn as keyof Provider];
      const bVal = b[sortColumn as keyof Provider];

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return 0;
    });
  }, [filteredProviders, sortColumn, sortDirection]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Calculate composition statistics
  const compositionStats = useMemo(() => {
    if (mockProviders.length === 0) return null;

    const totalProviders = mockProviders.length;
    const totalNPIs = new Set(mockProviders.map(p => p.NPI)).size;
    const fqhcCount = mockProviders.filter(p => p.IS_FQHC).length;
    const rhcCount = mockProviders.filter(p => p.IS_RHC).length;
    const cahCount = mockProviders.filter(p => p.IS_CAH).length;

    const providerTypes = mockProviders.reduce((acc, p) => {
      acc[p.PROVIDER_TYPE] = (acc[p.PROVIDER_TYPE] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const uniqueStates = new Set(mockProviders.map(p => p.STATE)).size;
    const uniqueZips = new Set(mockProviders.map(p => p.ZIP)).size;

    return {
      totalProviders,
      totalNPIs,
      fqhcCount,
      fqhcPct: (fqhcCount / totalProviders) * 100,
      rhcCount,
      cahCount,
      providerTypes,
      uniqueStates,
      uniqueZips,
    };
  }, [mockProviders]);

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
        <h2 className="text-lg font-bold mb-4">Select ACO</h2>

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

        {selectedACO && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-2">Selected ACO:</h3>
            <div className="space-y-1 text-sm">
              <div><span className="font-medium">Name:</span> {selectedACO.ACO_NAME}</div>
              <div><span className="font-medium">ID:</span> {selectedACO.ACO_ID}</div>
              <div><span className="font-medium">State:</span> {selectedACO.ACO_STATE}</div>
              <div><span className="font-medium">Track:</span> {selectedACO.ACO_TRACK}</div>
              <div><span className="font-medium">Beneficiaries:</span> {selectedACO.TOTAL_BENEFICIARIES?.toLocaleString()}</div>
              <div><span className="font-medium">Performance Year:</span> {selectedYear}</div>
            </div>
          </div>
        )}
      </div>

      {selectedACO && (
        <>
          {/* Composition Summary Cards */}
          {compositionStats ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between mb-2">
                  <Building className="h-6 w-6 text-blue-500" />
                  <span className="text-2xl font-bold">{compositionStats.totalProviders}</span>
                </div>
                <p className="text-sm text-gray-600">Total TINs</p>
              </div>

              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between mb-2">
                  <Users className="h-6 w-6 text-green-500" />
                  <span className="text-2xl font-bold">{compositionStats.totalNPIs}</span>
                </div>
                <p className="text-sm text-gray-600">Total NPIs</p>
              </div>

              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between mb-2">
                  <MapPin className="h-6 w-6 text-purple-500" />
                  <span className="text-2xl font-bold">{compositionStats.uniqueStates}</span>
                </div>
                <p className="text-sm text-gray-600">States</p>
              </div>

              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between mb-2">
                  <FileText className="h-6 w-6 text-orange-500" />
                  <span className="text-2xl font-bold">{compositionStats.fqhcPct.toFixed(0)}%</span>
                </div>
                <p className="text-sm text-gray-600">FQHC Share</p>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-yellow-900 mb-2">Provider Data Not Available</h3>
                  <p className="text-sm text-yellow-800 mb-3">
                    Provider-level participant data (ACO_Providers table) needs to be loaded from the CMS MSSP Provider-level PUF to display the roster for this ACO.
                  </p>
                  <div className="bg-white rounded-lg p-4 text-xs text-gray-700">
                    <p className="font-medium mb-2">To populate this view:</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Download the MSSP Provider-level PUF from data.cms.gov</li>
                      <li>Load the data into the RAW.RAW_MSSP_ACO_PROVIDERS table</li>
                      <li>Run the dbt models to create the ACO_Providers table</li>
                      <li>Rebuild the dashboard to include provider data</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Provider Table */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Participating Providers</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search providers..."
                  value={providerSearchTerm}
                  onChange={(e) => setProviderSearchTerm(e.target.value)}
                  className="pl-10 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!compositionStats}
                />
                {providerSearchTerm && (
                  <button
                    onClick={() => setProviderSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {compositionStats ? (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b">
                        <th
                          className="text-left py-3 px-4 cursor-pointer hover:bg-gray-50"
                          onClick={() => handleSort('PROVIDER_NAME')}
                        >
                          Provider Name {sortColumn === 'PROVIDER_NAME' && (sortDirection === 'asc' ? '↑' : '↓')}
                        </th>
                        <th
                          className="text-left py-3 px-4 cursor-pointer hover:bg-gray-50"
                          onClick={() => handleSort('TIN')}
                        >
                          TIN {sortColumn === 'TIN' && (sortDirection === 'asc' ? '↑' : '↓')}
                        </th>
                        <th
                          className="text-left py-3 px-4 cursor-pointer hover:bg-gray-50"
                          onClick={() => handleSort('NPI')}
                        >
                          NPI {sortColumn === 'NPI' && (sortDirection === 'asc' ? '↑' : '↓')}
                        </th>
                        <th
                          className="text-left py-3 px-4 cursor-pointer hover:bg-gray-50"
                          onClick={() => handleSort('PROVIDER_TYPE')}
                        >
                          Type {sortColumn === 'PROVIDER_TYPE' && (sortDirection === 'asc' ? '↑' : '↓')}
                        </th>
                        <th className="text-left py-3 px-4">Designations</th>
                        <th
                          className="text-left py-3 px-4 cursor-pointer hover:bg-gray-50"
                          onClick={() => handleSort('CITY')}
                        >
                          Location {sortColumn === 'CITY' && (sortDirection === 'asc' ? '↑' : '↓')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedProviders.length > 0 ? (
                        sortedProviders.map((provider, index) => (
                          <tr key={`${provider.TIN}-${provider.NPI}-${index}`} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4">{provider.PROVIDER_NAME}</td>
                            <td className="py-3 px-4 font-mono text-sm">{provider.TIN}</td>
                            <td className="py-3 px-4 font-mono text-sm">{provider.NPI}</td>
                            <td className="py-3 px-4">{provider.PROVIDER_TYPE}</td>
                            <td className="py-3 px-4">
                              <div className="flex gap-1">
                                {provider.IS_FQHC && (
                                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">FQHC</span>
                                )}
                                {provider.IS_RHC && (
                                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">RHC</span>
                                )}
                                {provider.IS_CAH && (
                                  <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">CAH</span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-sm">
                              {provider.CITY}, {provider.STATE} {provider.ZIP}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-gray-500">
                            {providerSearchTerm
                              ? `No providers found matching "${providerSearchTerm}"`
                              : 'No provider data available for this ACO'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p>Provider data will appear here once loaded</p>
              </div>
            )}
          </div>
        </>
      )}

      {!selectedACO && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600">
            Select an ACO above to view its participating providers
          </p>
        </div>
      )}
    </div>
  );
}
