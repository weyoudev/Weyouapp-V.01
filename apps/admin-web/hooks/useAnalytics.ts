import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { AnalyticsPreset, AnalyticsResponse, DashboardKpisResponse } from '@/types';

/** Presets that trigger API (exclude CUSTOM). */
export type RevenuePreset = Exclude<AnalyticsPreset, 'CUSTOM'>;

function fetchDashboardKpis(): Promise<DashboardKpisResponse> {
  return api.get<DashboardKpisResponse>('/admin/analytics/dashboard-kpis').then((r) => r.data);
}

export function useDashboardKpis(options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;
  return useQuery({
    queryKey: ['admin', 'analytics', 'dashboard-kpis'],
    queryFn: fetchDashboardKpis,
    enabled,
  });
}

function fetchRevenue(
  preset?: RevenuePreset,
  dateFrom?: string,
  dateTo?: string
): Promise<AnalyticsResponse> {
  const params = new URLSearchParams();
  if (preset && preset !== 'CUSTOM') params.set('preset', preset);
  if (dateFrom) params.set('dateFrom', dateFrom);
  if (dateTo) params.set('dateTo', dateTo);
  const q = params.toString();
  return api
    .get<AnalyticsResponse>(`/admin/analytics/revenue${q ? `?${q}` : ''}`)
    .then((r) => r.data);
}

export interface UseAnalyticsRevenueOptions {
  preset?: AnalyticsPreset;
  dateFrom?: string;
  dateTo?: string;
  enabled?: boolean;
}

export function useAnalyticsRevenue(options: UseAnalyticsRevenueOptions) {
  const { preset, dateFrom, dateTo, enabled = true } = options;
  const usePreset = preset && preset !== 'CUSTOM';
  return useQuery({
    queryKey: ['admin', 'analytics', 'revenue', options],
    queryFn: () =>
      fetchRevenue(
        usePreset ? (preset as RevenuePreset) : undefined,
        dateFrom,
        dateTo
      ),
    enabled,
  });
}
