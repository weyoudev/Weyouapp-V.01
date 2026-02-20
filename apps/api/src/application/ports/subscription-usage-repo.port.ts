export interface SubscriptionUsageRecord {
  id: string;
  subscriptionId: string;
  orderId: string;
  invoiceId: string | null;
  deductedPickups: number;
  deductedKg: number;
  deductedItemsCount: number;
  createdAt: Date;
}

export interface CreateSubscriptionUsageInput {
  subscriptionId: string;
  orderId: string;
  invoiceId?: string | null;
  deductedPickups?: number;
  deductedKg?: number;
  deductedItemsCount?: number;
}

export interface SubscriptionUsageRepo {
  create(data: CreateSubscriptionUsageInput): Promise<SubscriptionUsageRecord>;
  findByOrderId(orderId: string): Promise<SubscriptionUsageRecord | null>;
  findByOrderIdAndSubscriptionId(orderId: string, subscriptionId: string): Promise<SubscriptionUsageRecord | null>;
  findByInvoiceIdAndSubscriptionId(invoiceId: string, subscriptionId: string): Promise<SubscriptionUsageRecord | null>;
  /** Order IDs that have usage records for this subscription (for customer subscription-orders list). */
  listOrderIdsBySubscriptionId(subscriptionId: string): Promise<string[]>;
  /** Update deducted kg/items for an existing usage (e.g. when final invoice is issued with final qty). */
  updateDeductedAmounts(orderId: string, subscriptionId: string, deductedKg: number, deductedItemsCount: number): Promise<void>;
}
