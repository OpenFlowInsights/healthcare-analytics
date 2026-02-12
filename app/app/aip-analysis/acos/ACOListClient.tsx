"use client";

import { useState } from 'react';
import Navigation from "@/components/Navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface ACOListClientProps {
  year: number;
  years: number[];
  acos: {
    ACO_ID: string;
    ACO_NAME: string;
    ACO_TRACK: string;
    TOTAL_SPENDING: number;
  }[];
}

export function ACOListClient({ year, years, acos }: ACOListClientProps) {
  const router = useRouter();
  const [selectedYear, setSelectedYear] = useState(year);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'spending'>('spending');

  const handleYearChange = (newYear: number) => {
    setSelectedYear(newYear);
    router.push(`/aip-analysis/acos?year=${newYear}`);
  };

  // Filter and sort ACOs
  const filteredACOs = acos
    .filter(aco =>
      aco.ACO_NAME.toLowerCase().includes(searchTerm.toLowerCase()) ||
      aco.ACO_ID.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'name') {
        return a.ACO_NAME.localeCompare(b.ACO_NAME);
      }
      return (b.TOTAL_SPENDING || 0) - (a.TOTAL_SPENDING || 0);
    });

  return (
    <div>
      <Navigation />
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <Breadcrumbs
            items={[
              { label: 'Dashboards', href: '/dashboards' },
              { label: 'AIP Analysis', href: '/aip-analysis' },
              { label: 'ACO List' },
            ]}
          />

          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">ACO Profiles</h1>
              <p className="text-sm text-gray-500 mt-1">
                {acos.length} ACOs with AIP data
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Performance Year
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => handleYearChange(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {years.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search ACO
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name or ID..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'name' | 'spending')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="spending">Total Spending (High to Low)</option>
                  <option value="name">ACO Name (A-Z)</option>
                </select>
              </div>
            </div>
          </div>

          {/* ACO List */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Track
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total AIP Spending
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredACOs.map((aco) => (
                    <tr key={aco.ACO_ID} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{aco.ACO_ID}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{aco.ACO_NAME}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {aco.ACO_TRACK}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                        ${aco.TOTAL_SPENDING?.toLocaleString() || '0'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <Link
                          href={`/aip-analysis/aco/${aco.ACO_ID}?year=${selectedYear}`}
                          className="text-blue-600 hover:text-blue-900 font-medium"
                        >
                          View Profile →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredACOs.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">No ACOs found matching your search.</p>
                </div>
              )}
            </div>
          </div>

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
