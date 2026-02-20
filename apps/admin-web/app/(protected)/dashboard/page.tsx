'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAnalyticsRevenue, useDashboardKpis } from '@/hooks/useAnalytics';
import { useOrders } from '@/hooks/useOrders';
import { useBranches } from '@/hooks/useBranches';
import { BranchFilter } from '@/components/shared/BranchFilter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorDisplay } from '@/components/shared/ErrorDisplay';
import { OrderStatusBadge } from '@/components/shared/StatusBadge';
import { formatMoney, formatDate } from '@/lib/format';
import type { AdminOrderListRow, OrderStatus } from '@/types';
import { Calendar, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const HIDE_FROM_PICKUPS: OrderStatus[] = ['PICKED_UP', 'DELIVERED', 'CANCELLED'];

/** Current date in IST (YYYY-MM-DD) so Today/Tomorrow labels are correct for admin. */
function getTodayIST(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Normalize pickupDate from API (may be ISO string) to YYYY-MM-DD. */
function pickupDateKey(pickupDate: string): string {
  return typeof pickupDate === 'string' && pickupDate.length >= 10 ? pickupDate.slice(0, 10) : pickupDate;
}

function getDayLabel(dateKey: string, todayKey: string): string {
  const d = new Date(dateKey + 'T12:00:00Z');
  const today = new Date(todayKey + 'T12:00:00Z');
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === 2) return 'Day after tomorrow';
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

export default function DashboardPage() {
  const router = useRouter();
  const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  const todayKey = useMemo(() => getTodayIST(), []);
  const pickupDateFrom = useMemo(() => {
    const d = new Date(todayKey + 'T12:00:00Z');
    d.setDate(d.getDate() - 7);
    return toDateKey(d);
  }, [todayKey]);
  const pickupDateTo = useMemo(() => {
    const d = new Date(todayKey + 'T12:00:00Z');
    d.setDate(d.getDate() + 6);
    return toDateKey(d);
  }, [todayKey]);

  const { data, isLoading, error } = useAnalyticsRevenue({ preset: 'TODAY' });
  const { data: kpis, isLoading: kpisLoading, error: kpisError } = useDashboardKpis();
  const { data: branches = [] } = useBranches();
  const effectiveBranchId = selectedBranchIds.length === 1 ? selectedBranchIds[0] : undefined;

  const { data: ordersData, isLoading: ordersLoading } = useOrders(
    {
      pickupDateFrom,
      pickupDateTo,
      limit: 200,
      branchId: effectiveBranchId ?? undefined,
    },
    { refetchInterval: 30000 }
  );

  const scheduledPickups = useMemo(() => {
    const list = (ordersData?.data ?? []).filter(
      (row) => !HIDE_FROM_PICKUPS.includes(row.status as OrderStatus)
    );
    const missedFirst = [...list].sort((a, b) => {
      const aKey = pickupDateKey(a.pickupDate);
      const bKey = pickupDateKey(b.pickupDate);
      const aMissed = aKey < todayKey ? 1 : 0;
      const bMissed = bKey < todayKey ? 1 : 0;
      if (aMissed !== bMissed) return aMissed - bMissed;
      if (aKey !== bKey) return aKey.localeCompare(bKey);
      return (a.timeWindow || '').localeCompare(b.timeWindow || '');
    });
    const byDate = new Map<string, AdminOrderListRow[]>();
    for (const row of missedFirst) {
      const key = pickupDateKey(row.pickupDate);
      if (!byDate.has(key)) byDate.set(key, []);
      byDate.get(key)!.push(row);
    }
    const orderedKeys = Array.from(byDate.keys()).sort();
    return { list: missedFirst, byDate, orderedKeys };
  }, [ordersData?.data, todayKey]);

  if (error) {
    return (
      <div>
        <p className="text-sm text-destructive">Failed to load analytics.</p>
        <ErrorDisplay error={error} className="mt-2" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <BranchFilter
          selectedBranchIds={selectedBranchIds}
          onChange={setSelectedBranchIds}
          compactLabel
        />
      </div>

      {/* KPIs in one row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collected (today)</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <span className="text-2xl font-bold">{formatMoney(data?.collectedPaise ?? 0)}</span>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders (today)</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <span className="text-2xl font-bold">{data?.ordersCount ?? 0}</span>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Invoices (today)</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <span className="text-2xl font-bold">{data?.invoicesCount ?? 0}</span>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            {kpisError ? (
              <p className="text-sm text-destructive">Failed to load</p>
            ) : kpisLoading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <span className="text-2xl font-bold">{kpis?.activeSubscriptionsCount ?? 0}</span>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total customers</CardTitle>
          </CardHeader>
          <CardContent>
            {kpisError ? (
              <p className="text-sm text-destructive">Failed to load</p>
            ) : kpisLoading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <span className="text-2xl font-bold">{kpis?.totalCustomersCount ?? 0}</span>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Scheduled Pickups (Today → 1 week, missed on top) */}
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <CardTitle>Scheduled Pickups</CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="mr-1 h-4 w-4" />
              List
            </Button>
            <Button
              variant={viewMode === 'calendar' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('calendar')}
            >
              <Calendar className="mr-1 h-4 w-4" />
              Calendar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Next 1 week pickups by date chosen by customer. Missed (past pickups not picked up) appear at top. New confirmed bookings appear here as soon as the customer confirms. List refreshes every 30s. Picked up or cancelled orders are hidden.
          </p>
          {ordersLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : viewMode === 'list' ? (
            <>
              {scheduledPickups.list.length === 0 ? (
                <p className="text-muted-foreground text-sm py-6 text-center">No scheduled pickups in this range.</p>
              ) : (
                <div className="space-y-6">
                  {scheduledPickups.orderedKeys.map((dateKey) => {
                    const rows = scheduledPickups.byDate.get(dateKey)!;
                    const isMissed = dateKey < todayKey;
                    const dayLabel = getDayLabel(dateKey, todayKey);
                    return (
                      <div key={dateKey}>
                        <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                          {dayLabel}
                          <span className="text-muted-foreground font-normal">({dateKey})</span>
                          {isMissed && (
                            <span className="text-destructive text-xs font-medium">Missed / Not picked up</span>
                          )}
                        </h3>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Order</TableHead>
                              <TableHead>Customer</TableHead>
                              <TableHead>Time</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Service</TableHead>
                              <TableHead className="text-right">Total</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {rows.map((row) => (
                              <TableRow
                                key={row.id}
                                className="cursor-pointer"
                                onClick={() => router.push(`/orders/${row.id}`)}
                              >
                                <TableCell className="font-mono text-xs">{row.id.slice(0, 8)}…</TableCell>
                                <TableCell className="max-w-[140px] truncate">{row.customerName ?? '—'}</TableCell>
                                <TableCell>{row.timeWindow || '—'}</TableCell>
                                <TableCell><OrderStatusBadge status={row.status} /></TableCell>
                                <TableCell>{row.serviceType.replace(/_/g, ' ')}</TableCell>
                                <TableCell className="text-right">
                                  {row.billTotalPaise != null ? formatMoney(row.billTotalPaise) : '—'}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            /* Calendar view: same data grouped by day in a grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
              {scheduledPickups.orderedKeys.map((dateKey) => {
                const rows = scheduledPickups.byDate.get(dateKey)!;
                const isMissed = dateKey < todayKey;
                const dayLabel = getDayLabel(dateKey, todayKey);
                return (
                  <div
                    key={dateKey}
                    className={`rounded-lg border p-3 min-h-[120px] ${isMissed ? 'border-destructive/50 bg-destructive/5' : ''}`}
                  >
                    <div className="text-sm font-semibold mb-2">
                      {dayLabel}
                      {isMissed && <span className="text-destructive text-xs block">Missed</span>}
                    </div>
                    <ul className="space-y-1">
                      {rows.map((row) => (
                        <li
                          key={row.id}
                          className="text-xs cursor-pointer hover:underline truncate"
                          onClick={() => router.push(`/orders/${row.id}`)}
                          title={`${row.customerName ?? row.id} · ${row.timeWindow}`}
                        >
                          {row.customerName ?? row.id.slice(0, 8)} · {row.timeWindow}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
              {scheduledPickups.orderedKeys.length === 0 && (
                <p className="text-muted-foreground text-sm col-span-full py-4 text-center">No scheduled pickups.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
