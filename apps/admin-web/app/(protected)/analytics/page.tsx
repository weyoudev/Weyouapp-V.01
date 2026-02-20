'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAnalyticsRevenue } from '@/hooks/useAnalytics';
import { AnalyticsFilterBar, type BreakdownMode } from '@/components/admin/analytics/AnalyticsFilterBar';
import { RevenueKpis } from '@/components/admin/analytics/RevenueKpis';
import { RevenueLineChart } from '@/components/admin/analytics/RevenueLineChart';
import { RevenueBreakdownTable } from '@/components/admin/analytics/RevenueBreakdownTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { toAnalyticsPoints } from '@/types';
import type { AnalyticsPreset, AnalyticsTotals } from '@/types';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';

const DEFAULT_PRESET: AnalyticsPreset = 'THIS_MONTH';

function getErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const ax = err as AxiosError<{ error?: string; message?: string }>;
    const msg = ax.response?.data?.error ?? ax.response?.data?.message ?? (err as Error).message;
    return msg || 'Request failed';
  }
  return err instanceof Error ? err.message : 'Request failed';
}

function isInvalidRangeError(err: unknown): boolean {
  if (err && typeof err === 'object' && 'response' in err) {
    const ax = err as AxiosError<{ error?: string; code?: string }>;
    const code = ax.response?.data?.code ?? ax.response?.data?.error ?? '';
    return String(code).toUpperCase().includes('ANALYTICS_INVALID_RANGE');
  }
  return false;
}

export default function AnalyticsPage() {
  const [selectedPreset, setSelectedPreset] = useState<AnalyticsPreset>(DEFAULT_PRESET);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [appliedDateFrom, setAppliedDateFrom] = useState('');
  const [appliedDateTo, setAppliedDateTo] = useState('');
  const [breakdownMode, setBreakdownMode] = useState<BreakdownMode>('DAILY');
  const [dateRangeError, setDateRangeError] = useState<string | null>(null);

  const isCustom = selectedPreset === 'CUSTOM';
  const queryPreset = isCustom ? undefined : selectedPreset;
  const queryDateFrom = isCustom ? appliedDateFrom : undefined;
  const queryDateTo = isCustom ? appliedDateTo : undefined;
  const queryEnabled = !isCustom || (!!appliedDateFrom && !!appliedDateTo);

  const { data, isLoading, error } = useAnalyticsRevenue({
    preset: queryPreset,
    dateFrom: queryDateFrom || undefined,
    dateTo: queryDateTo || undefined,
    enabled: queryEnabled,
  });

  useEffect(() => {
    if (!error) {
      setDateRangeError(null);
      return;
    }
    const msg = getErrorMessage(error);
    if (isInvalidRangeError(error)) {
      setDateRangeError(msg || 'Invalid date range');
      toast.error(msg || 'Invalid date range');
    } else {
      toast.error(msg);
    }
  }, [error]);

  const handleApplyCustomRange = useCallback(() => {
    setDateRangeError(null);
    if (!dateFrom.trim() || !dateTo.trim()) {
      setDateRangeError('Please select both dates');
      return;
    }
    const from = new Date(dateFrom);
    const to = new Date(dateTo);
    if (from > to) {
      setDateRangeError('From date must be before or equal to To date');
      return;
    }
    setAppliedDateFrom(dateFrom);
    setAppliedDateTo(dateTo);
  }, [dateFrom, dateTo]);

  const handleResetToPreset = useCallback(() => {
    setSelectedPreset(DEFAULT_PRESET);
    setDateFrom('');
    setDateTo('');
    setAppliedDateFrom('');
    setAppliedDateTo('');
    setDateRangeError(null);
  }, []);

  const handlePresetChange = useCallback((p: AnalyticsPreset) => {
    setSelectedPreset(p);
    if (p !== 'CUSTOM') setDateRangeError(null);
  }, []);

  const totals: AnalyticsTotals | null = data
    ? {
        billedPaise: data.billedPaise,
        collectedPaise: data.collectedPaise,
        ordersCount: data.ordersCount,
        invoicesCount: data.invoicesCount,
      }
    : null;
  const points = data ? toAnalyticsPoints(data.breakdown) : [];

  const showCustomPrompt = isCustom && !appliedDateFrom && !appliedDateTo;
  const showDashboard = queryEnabled;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Analytics</h1>

      <AnalyticsFilterBar
        preset={selectedPreset}
        setPreset={handlePresetChange}
        dateFrom={dateFrom}
        setDateFrom={setDateFrom}
        dateTo={dateTo}
        setDateTo={setDateTo}
        mode={breakdownMode}
        setMode={setBreakdownMode}
        onApplyCustomRange={handleApplyCustomRange}
        onResetToPreset={handleResetToPreset}
        isLoading={isLoading}
        dateRangeError={dateRangeError ?? undefined}
      />

      {showCustomPrompt && (
        <EmptyState
          title="Select a custom range"
          description="Choose From and To dates, then click Apply."
        />
      )}

      {showDashboard && (
        <>
          <RevenueKpis totals={totals} isLoading={isLoading} />

          {!isLoading && !data && !error && (
            <EmptyState
              title="No data"
              description="Try a different preset or date range."
            />
          )}

          {(data || isLoading) && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Revenue trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <RevenueLineChart points={points} isLoading={isLoading} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <RevenueBreakdownTable
                    points={points}
                    isLoading={isLoading}
                    mode={breakdownMode}
                  />
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
}
