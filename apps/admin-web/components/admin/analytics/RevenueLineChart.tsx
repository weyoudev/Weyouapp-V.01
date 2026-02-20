'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { formatMoney } from '@/lib/format';
import type { AnalyticsPoint } from '@/types';

/** Format dateKey for chart axis (short). */
function formatDateKey(dateKey: string): string {
  if (!dateKey) return dateKey;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    return new Date(dateKey + 'Z').toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  }
  if (/^\d{4}-\d{2}$/.test(dateKey)) {
    return new Date(dateKey + '-01Z').toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
  }
  return dateKey;
}

export interface RevenueLineChartProps {
  points: AnalyticsPoint[];
  isLoading: boolean;
}

export function RevenueLineChart({ points, isLoading }: RevenueLineChartProps) {
  if (isLoading) {
    return <Skeleton className="h-[320px] w-full" />;
  }

  if (!points.length) {
    return (
      <div className="flex h-[320px] items-center justify-center rounded-lg border border-dashed text-muted-foreground">
        No breakdown data to display
      </div>
    );
  }

  const data = points.map((p) => ({
    ...p,
    dateLabel: formatDateKey(p.dateKey),
  }));

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="dateLabel"
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => {
            const rupees = v / 100;
            if (rupees >= 100000) return `₹${(rupees / 100000).toFixed(1)}L`;
            if (rupees >= 1000) return `₹${(rupees / 1000).toFixed(0)}K`;
            return `₹${rupees}`;
          }}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const row = payload[0].payload;
            return (
              <div className="rounded-md border bg-background p-3 shadow-md">
                <p className="text-xs text-muted-foreground mb-1">{row.dateLabel}</p>
                <p className="text-sm">Billed: {formatMoney(row.billedPaise)}</p>
                <p className="text-sm">Collected: {formatMoney(row.collectedPaise)}</p>
              </div>
            );
          }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="collectedPaise"
          name="Collected"
          stroke="hsl(var(--chart-1))"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="billedPaise"
          name="Billed"
          stroke="hsl(var(--chart-2))"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
