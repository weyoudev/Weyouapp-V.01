/**
 * Revenue analytics date presets. India FY: Apr 1 – Mar 31.
 * All ranges are inclusive [dateFrom, dateTo] in India date terms; stored as UTC day boundaries.
 */
const INDIA_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function toIndiaDate(d: Date): { y: number; m: number; d: number } {
  const t = new Date(d.getTime() + INDIA_OFFSET_MS);
  return {
    y: t.getUTCFullYear(),
    m: t.getUTCMonth(),
    d: t.getUTCDate(),
  };
}

function indiaToUtcStart(y: number, m: number, d: number): Date {
  return new Date(Date.UTC(y, m, d) - INDIA_OFFSET_MS);
}

function indiaToUtcEnd(y: number, m: number, d: number): Date {
  return new Date(Date.UTC(y, m, d + 1) - INDIA_OFFSET_MS);
}

export type RevenuePreset =
  | 'TODAY'
  | 'THIS_MONTH'
  | 'LAST_1_MONTH'
  | 'LAST_3_MONTHS'
  | 'LAST_6_MONTHS'
  | 'LAST_12_MONTHS'
  | 'THIS_YEAR'
  | 'LAST_YEAR'
  | 'FY25'
  | 'FY26'
  | 'FY27';

export interface RevenueDateRange {
  dateFrom: Date;
  dateTo: Date;
  /** For breakdown: daily if <= 92 days, else monthly */
  breakdownKind: 'daily' | 'monthly';
}

/**
 * Returns the revenue date range for a preset. Uses "now" for relative presets (TODAY, THIS_MONTH, etc.).
 */
export function getRevenueDateRange(preset: RevenuePreset, now: Date = new Date()): RevenueDateRange {
  const ind = toIndiaDate(now);
  const y = ind.y;
  const m = ind.m;
  const d = ind.d;

  switch (preset) {
    case 'TODAY': {
      const dateFrom = indiaToUtcStart(y, m, d);
      const dateTo = indiaToUtcEnd(y, m, d);
      return { dateFrom, dateTo, breakdownKind: 'daily' };
    }
    case 'THIS_MONTH': {
      const dateFrom = indiaToUtcStart(y, m, 1);
      const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
      const dateTo = indiaToUtcEnd(y, m, lastDay);
      return { dateFrom, dateTo, breakdownKind: 'daily' };
    }
    case 'LAST_1_MONTH': {
      const dateFrom = indiaToUtcStart(y, m - 1, 1);
      const dateTo = indiaToUtcEnd(y, m, 0);
      return { dateFrom, dateTo, breakdownKind: 'daily' };
    }
    case 'LAST_3_MONTHS': {
      const dateFrom = indiaToUtcStart(y, m - 2, 1);
      const dateTo = indiaToUtcEnd(y, m, d);
      return { dateFrom, dateTo, breakdownKind: 'daily' };
    }
    case 'LAST_6_MONTHS': {
      const dateFrom = indiaToUtcStart(y, m - 5, 1);
      const dateTo = indiaToUtcEnd(y, m, d);
      return { dateFrom, dateTo, breakdownKind: 'daily' };
    }
    case 'LAST_12_MONTHS': {
      const dateFrom = indiaToUtcStart(y - 1, m, d);
      const dateTo = indiaToUtcEnd(y, m, d);
      return { dateFrom, dateTo, breakdownKind: 'monthly' };
    }
    case 'THIS_YEAR': {
      const dateFrom = indiaToUtcStart(y, 0, 1);
      const dateTo = indiaToUtcEnd(y, m, d);
      return { dateFrom, dateTo, breakdownKind: 'monthly' };
    }
    case 'LAST_YEAR': {
      const dateFrom = indiaToUtcStart(y - 1, 0, 1);
      const dateTo = indiaToUtcEnd(y - 1, 11, 31);
      return { dateFrom, dateTo, breakdownKind: 'monthly' };
    }
    case 'FY25': {
      return fyRange(2025);
    }
    case 'FY26': {
      return fyRange(2026);
    }
    case 'FY27': {
      return fyRange(2027);
    }
    default:
      return getRevenueDateRange('TODAY', now);
  }
}

/** India FY: Apr 1 (year) to Mar 31 (year+1). */
function fyRange(fyStartYear: number): RevenueDateRange {
  const dateFrom = indiaToUtcStart(fyStartYear, 3, 1);
  const dateTo = indiaToUtcEnd(fyStartYear + 1, 2, 31);
  return { dateFrom, dateTo, breakdownKind: 'monthly' };
}

/**
 * Custom range. dateFrom/dateTo are interpreted as India date day boundaries.
 * Throws if dateFrom > dateTo. breakdownKind: daily if <= 92 days, else monthly.
 */
export function getRevenueDateRangeCustom(
  dateFrom: Date,
  dateTo: Date,
): RevenueDateRange {
  if (dateFrom.getTime() > dateTo.getTime()) {
    throw new Error('ANALYTICS_INVALID_RANGE');
  }
  const from = toIndiaDate(dateFrom);
  const to = toIndiaDate(dateTo);
  const days = Math.round((dateTo.getTime() - dateFrom.getTime()) / (24 * 60 * 60 * 1000));
  return {
    dateFrom: indiaToUtcStart(from.y, from.m, from.d),
    dateTo: indiaToUtcEnd(to.y, to.m, to.d),
    breakdownKind: days <= 92 ? 'daily' : 'monthly',
  };
}
