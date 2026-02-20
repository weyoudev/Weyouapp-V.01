/** Saved address as returned with customer profile (GET /admin/customers/:id). */
export interface CustomerAddress {
  id: string;
  label: string;
  addressLine: string;
  pincode: string;
  isDefault: boolean;
}

/** Subscription info when returned with customer detail (backend may include it) */
export interface CustomerSubscriptionInfo {
  id: string;
  planName: string;
  /** Address label (e.g. Home, Office) for this subscription. */
  addressLabel?: string | null;
  remainingPickups: number;
  usedKg: number;
  usedItemsCount: number;
  usedPickups?: number;
  maxPickups?: number;
  kgLimit: number | null;
  itemsLimit: number | null;
  expiryDate: string;
  validityStartDate?: string;
  /** When the subscription was inactivated (past subs only). */
  inactivatedAt?: string;
  active: boolean;
}

export interface CustomerRecord {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  role: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  /** Saved addresses for this customer. */
  addresses?: CustomerAddress[];
  /** First active subscription (backward compat). */
  subscription?: CustomerSubscriptionInfo | null;
  /** All active subscriptions. */
  activeSubscriptions?: CustomerSubscriptionInfo[];
  /** All past (inactive) subscriptions. */
  pastSubscriptions?: CustomerSubscriptionInfo[];
}

/** Customer list row with order/subscription counts (GET /admin/customers). */
export interface CustomerListRow extends CustomerRecord {
  pastOrdersCount: number;
  activeOrdersCount: number;
  activeSubscriptionsCount: number;
  inactiveSubscriptionsCount: number;
}

export interface PatchCustomerBody {
  name?: string | null;
  email?: string | null;
  notes?: string | null;
}

export interface PatchSubscriptionOverrideBody {
  active?: boolean;
  expiryDate?: string;
  usedKg?: number;
  usedItemsCount?: number;
  usedPickups?: number;
}
