"use client";

import { useMemo } from 'react';
import { BarChart, Users, TrendingUp, TrendingDown } from "lucide-react";
import type { MultiYearDashboardData, ACORanking } from '@/lib/data/aco';
import { getMetricDisplayValue } from '@/lib/utils/riskAdjustment';

interface SNFWaiverViewProps {
  data: MultiYearDashboardData;
  selectedYear: number;
  onYearChange: (year: number) => void;
  isRiskAdjusted?: boolean;
}

interface ComparisonStats {
  count: number;
  avgSNFAdmissions: number;
  avgSNFLOS: number;
  avgEDVisitsHosp: number;
  avgIPAdmissions: number;
  avgSNFPayPerStay: number;
  avgSavingsRate: number;
  totalSavingsLosses: number;
}

export function SNFWaiverView({ data, selectedYear, onYearChange, isRiskAdjusted = false }: SNFWaiverViewProps) {
  const { years, dataByYear } = data;
  const currentYearData = dataByYear[selectedYear];
  const allACOs = currentYearData?.rankings || [];

  // Calculate statistics for waiver participants and non-participants
  const stats = useMemo(() => {
    const waiverParticipants = allACOs.filter(aco => aco.SNF_WAIVER === 'Y' || aco.SNF_WAIVER === 'y');
    const nonParticipants = allACOs.filter(aco => aco.SNF_WAIVER !== 'Y' && aco.SNF_WAIVER !== 'y');

    const calculateStats = (acos: ACORanking[]): ComparisonStats => {
      const validACOs = acos.filter(aco => aco.SAVINGS_RATE_PCT !== null);

      // Helper to get metric value with optional risk adjustment
      const getMetricValue = (aco: ACORanking, metricKey: keyof ACORanking): number => {
        const value = isRiskAdjusted
          ? getMetricDisplayValue(aco, metricKey, isRiskAdjusted)
          : aco[metricKey];
        return typeof value === 'number' ? value : 0;
      };

      return {
        count: acos.length,
        avgSNFAdmissions: acos.reduce((sum, aco) => sum + getMetricValue(aco, 'SNF_ADMISSIONS_PER_1K'), 0) / acos.length || 0,
        avgSNFLOS: acos.reduce((sum, aco) => sum + getMetricValue(aco, 'SNF_LENGTH_OF_STAY'), 0) / acos.length || 0,
        avgEDVisitsHosp: acos.reduce((sum, aco) => sum + getMetricValue(aco, 'ED_VISITS_HOSP_PER_1K'), 0) / acos.length || 0,
        avgIPAdmissions: acos.reduce((sum, aco) => sum + getMetricValue(aco, 'IP_ADMISSIONS'), 0) / acos.length || 0,
        avgSNFPayPerStay: acos.reduce((sum, aco) => sum + getMetricValue(aco, 'SNF_PAY_PER_STAY'), 0) / acos.length || 0,
        avgSavingsRate: validACOs.reduce((sum, aco) => sum + aco.SAVINGS_RATE_PCT, 0) / validACOs.length || 0,
        totalSavingsLosses: acos.reduce((sum, aco) => sum + (aco.SAVINGS_LOSSES || 0), 0),
      };
    };

    return {
      waiver: calculateStats(waiverParticipants),
      nonWaiver: calculateStats(nonParticipants),
    };
  }, [allACOs, isRiskAdjusted]);

  const MetricCard = ({
    title,
    waiverValue,
    nonWaiverValue,
    unit = '',
    format = 'number',
    lowerIsBetter = false
  }: {
    title: string;
    waiverValue: number;
    nonWaiverValue: number;
    unit?: string;
    format?: 'number' | 'currency' | 'percent';
    lowerIsBetter?: boolean;
  }) => {
    const difference = waiverValue - nonWaiverValue;
    const percentDiff = nonWaiverValue !== 0 ? (difference / nonWaiverValue) * 100 : 0;
    const isBetter = lowerIsBetter ? difference < 0 : difference > 0;

    const formatValue = (val: number) => {
      if (format === 'currency') {
        return `$${(val / 1000000).toFixed(1)}M`;
      } else if (format === 'percent') {
        return `${val.toFixed(2)}%`;
      } else {
        return val.toFixed(2);
      }
    };

    return (
      <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-3">{title}</h4>

        <div className="space-y-3">
          <div>
            <div className="text-xs text-gray-500 mb-1">SNF Waiver Participants</div>
            <div className="text-2xl font-bold text-blue-600">{formatValue(waiverValue)}{unit}</div>
          </div>

          <div>
            <div className="text-xs text-gray-500 mb-1">Non-Participants</div>
            <div className="text-2xl font-bold text-gray-600">{formatValue(nonWaiverValue)}{unit}</div>
          </div>

          <div className="border-t pt-2">
            <div className="text-xs text-gray-500 mb-1">Difference</div>
            <div className={`flex items-center gap-2 ${isBetter ? 'text-green-600' : difference === 0 ? 'text-gray-500' : 'text-red-600'}`}>
              {isBetter ? (
                <TrendingUp className="h-4 w-4" />
              ) : difference < 0 ? (
                <TrendingDown className="h-4 w-4" />
              ) : null}
              <span className="font-semibold">{formatValue(Math.abs(difference))}{unit}</span>
              <span className="text-xs">({percentDiff > 0 ? '+' : ''}{percentDiff.toFixed(1)}%)</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SNF Waiver Analysis</h1>
          <p className="text-sm text-gray-600 mt-1">
            Comparing performance of ACOs participating in SNF Waiver vs non-participants
          </p>
        </div>

        {/* Year Selector */}
        <select
          value={selectedYear}
          onChange={(e) => onYearChange(Number(e.target.value))}
          className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium"
        >
          {years.map(year => (
            <option key={year} value={year}>
              PY {year}
            </option>
          ))}
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-blue-900">SNF Waiver Participants</h3>
          </div>
          <div className="text-3xl font-bold text-blue-600">{stats.waiver.count}</div>
          <div className="text-sm text-blue-700 mt-1">ACOs in program</div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-5 w-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Non-Participants</h3>
          </div>
          <div className="text-3xl font-bold text-gray-600">{stats.nonWaiver.count}</div>
          <div className="text-sm text-gray-700 mt-1">ACOs not in program</div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart className="h-5 w-5 text-green-600" />
            <h3 className="font-semibold text-green-900">Total Comparison</h3>
          </div>
          <div className="text-3xl font-bold text-green-600">{allACOs.length}</div>
          <div className="text-sm text-green-700 mt-1">Total ACOs analyzed</div>
        </div>
      </div>

      {/* Utilization Metrics */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Utilization Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <MetricCard
            title="SNF Admissions per 1,000"
            waiverValue={stats.waiver.avgSNFAdmissions}
            nonWaiverValue={stats.nonWaiver.avgSNFAdmissions}
            lowerIsBetter={true}
          />
          <MetricCard
            title="SNF Length of Stay (days)"
            waiverValue={stats.waiver.avgSNFLOS}
            nonWaiverValue={stats.nonWaiver.avgSNFLOS}
            lowerIsBetter={true}
          />
          <MetricCard
            title="ED Visits (Hospital) per 1,000"
            waiverValue={stats.waiver.avgEDVisitsHosp}
            nonWaiverValue={stats.nonWaiver.avgEDVisitsHosp}
            lowerIsBetter={true}
          />
          <MetricCard
            title="Inpatient Admissions"
            waiverValue={stats.waiver.avgIPAdmissions}
            nonWaiverValue={stats.nonWaiver.avgIPAdmissions}
            lowerIsBetter={true}
          />
          <MetricCard
            title="SNF Pay per Stay"
            waiverValue={stats.waiver.avgSNFPayPerStay}
            nonWaiverValue={stats.nonWaiver.avgSNFPayPerStay}
            format="currency"
            lowerIsBetter={true}
          />
        </div>
      </div>

      {/* Financial Impact */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Financial Impact</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <MetricCard
            title="Average Savings Rate"
            waiverValue={stats.waiver.avgSavingsRate}
            nonWaiverValue={stats.nonWaiver.avgSavingsRate}
            format="percent"
          />
          <MetricCard
            title="Total Savings/Losses"
            waiverValue={stats.waiver.totalSavingsLosses}
            nonWaiverValue={stats.nonWaiver.totalSavingsLosses}
            format="currency"
          />
        </div>
      </div>

      {/* Insights */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-3">Key Insights</h3>
        <div className="space-y-2 text-sm text-gray-700">
          <div>
            • SNF Waiver participants show{' '}
            <span className={stats.waiver.avgSNFAdmissions < stats.nonWaiver.avgSNFAdmissions ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
              {((1 - stats.waiver.avgSNFAdmissions / stats.nonWaiver.avgSNFAdmissions) * 100).toFixed(1)}%
              {stats.waiver.avgSNFAdmissions < stats.nonWaiver.avgSNFAdmissions ? ' lower' : ' higher'}
            </span>
            {' '}SNF admission rates compared to non-participants
          </div>
          <div>
            • Average savings rate is{' '}
            <span className={stats.waiver.avgSavingsRate > stats.nonWaiver.avgSavingsRate ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
              {Math.abs(stats.waiver.avgSavingsRate - stats.nonWaiver.avgSavingsRate).toFixed(2)}%
              {stats.waiver.avgSavingsRate > stats.nonWaiver.avgSavingsRate ? ' higher' : ' lower'}
            </span>
            {' '}for SNF Waiver participants
          </div>
          <div>
            • Inpatient admissions are{' '}
            <span className={stats.waiver.avgIPAdmissions < stats.nonWaiver.avgIPAdmissions ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
              {((1 - stats.waiver.avgIPAdmissions / stats.nonWaiver.avgIPAdmissions) * 100).toFixed(1)}%
              {stats.waiver.avgIPAdmissions < stats.nonWaiver.avgIPAdmissions ? ' lower' : ' higher'}
            </span>
            {' '}among waiver participants
          </div>
        </div>
      </div>
    </div>
  );
}
