'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { formatMoney, formatDate } from '@/lib/format';
import type { AnalyticsPoint } from '@/types';
import type { BreakdownMode } from './AnalyticsFilterBar';

const INITIAL_ROWS = 15;
const ROWS_PER_PAGE = 20;

function formatDateKeyForTable(dateKey: string): string {
  if (!dateKey) return '—';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    return formatDate(dateKey + 'T00:00:00Z');
  }
  if (/^\d{4}-\d{2}$/.test(dateKey)) {
    return new Date(dateKey + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  }
  return dateKey;
}

function pendingPaise(billed: number, collected: number): number {
  return Math.max(0, billed - collected);
}

export interface RevenueBreakdownTableProps {
  points: AnalyticsPoint[];
  isLoading: boolean;
  mode: BreakdownMode;
}

export function RevenueBreakdownTable({ points, isLoading, mode }: RevenueBreakdownTableProps) {
  const [showCount, setShowCount] = useState(INITIAL_ROWS);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (!points.length) {
    return (
      <EmptyState
        title="No breakdown data"
        description="Select a different preset or date range."
      />
    );
  }

  const visible = points.slice(0, showCount);
  const hasMore = showCount < points.length;
  const remaining = points.length - showCount;

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Billed</TableHead>
            <TableHead className="text-right">Collected</TableHead>
            <TableHead className="text-right">Pending</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visible.map((p) => (
            <TableRow key={p.dateKey}>
              <TableCell>{formatDateKeyForTable(p.dateKey)}</TableCell>
              <TableCell className="text-right">{formatMoney(p.billedPaise)}</TableCell>
              <TableCell className="text-right">{formatMoney(p.collectedPaise)}</TableCell>
              <TableCell className="text-right">
                {formatMoney(pendingPaise(p.billedPaise, p.collectedPaise))}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {hasMore && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowCount((n) => n + ROWS_PER_PAGE)}
        >
          Load more ({remaining} remaining)
        </Button>
      )}
    </div>
  );
}
