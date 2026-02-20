export interface RevenueBreakdownItem {
  /** Date key (YYYY-MM-DD) or month key (YYYY-MM) */
  key: string;
  billedPaise: number;
  collectedPaise: number;
  ordersCount: number;
  invoicesCount: number;
}

export interface RevenueResult {
  billedPaise: number;
  collectedPaise: number;
  ordersCount: number;
  invoicesCount: number;
  breakdown: RevenueBreakdownItem[];
}

export interface AnalyticsRepo {
  getRevenue(dateFrom: Date, dateTo: Date, breakdownKind: 'daily' | 'monthly'): Promise<RevenueResult>;
}
