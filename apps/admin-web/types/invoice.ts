export type InvoiceItemType =
  | 'SERVICE'
  | 'DRYCLEAN_ITEM'
  | 'ADDON'
  | 'FEE'
  | 'DISCOUNT';

export interface InvoiceDraftItem {
  type: InvoiceItemType;
  name: string;
  quantity: number;
  unitPricePaise: number;
  amountPaise?: number;
  /** Catalog matrix: item id for Item → Segment → Service cascading */
  catalogItemId?: string | null;
  segmentCategoryId?: string | null;
  serviceCategoryId?: string | null;
}

export type InvoiceOrderMode = 'INDIVIDUAL' | 'SUBSCRIPTION_ONLY' | 'BOTH';

export interface InvoiceDraftBody {
  orderMode?: InvoiceOrderMode;
  items: InvoiceDraftItem[];
  taxPaise?: number;
  discountPaise?: number;
  subscriptionUtilized?: boolean;
  subscriptionId?: string | null;
  subscriptionUsageKg?: number | null;
  subscriptionUsageItems?: number | null;
  /** When using multiple subscriptions for this pickup: list of subscription IDs to deduct 1 pickup + weight/items from each. */
  subscriptionUsageSubscriptionIds?: string[];
  /** When set, add subscription to invoice (plan + start date + quantity); price included in subtotal/tax/discount. */
  newSubscription?: { planId: string; validityStartDate: string; quantityMonths?: number } | null;
  /** Multiple new subscriptions on same invoice; when set, use instead of newSubscription. */
  newSubscriptions?: Array<{ planId: string; validityStartDate: string; quantityMonths?: number }> | null;
  comments?: string | null;
}

export interface InvoiceDraftResponse {
  invoiceId: string;
  subtotal?: number;
  tax?: number;
  total?: number;
  status: string;
  type: string;
}

export interface InvoiceIssueResponse {
  invoiceId: string;
  pdfUrl: string;
  status: string;
}
