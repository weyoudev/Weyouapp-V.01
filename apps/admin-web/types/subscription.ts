export type SubscriptionVariant = 'SINGLE' | 'COUPLE' | 'FAMILY';
export type RedemptionMode = 'MULTI_USE' | 'SINGLE_USE';

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  redemptionMode: RedemptionMode;
  variant: SubscriptionVariant;
  validityDays: number;
  maxPickups: number;
  kgLimit: number | null;
  itemsLimit: number | null;
  minKgPerPickup: number | null;
  pricePaise: number;
  applicableServiceTypes: string[];
  active: boolean;
  /** Empty = all branches; non-empty = plan applies only to these branch IDs */
  branchIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatePlanBody {
  name: string;
  description?: string | null;
  redemptionMode?: RedemptionMode;
  variant: SubscriptionVariant;
  validityDays: number;
  maxPickups: number;
  kgLimit?: number | null;
  itemsLimit?: number | null;
  pricePaise?: number;
  active?: boolean;
  applicableServiceTypes?: string[];
  branchIds?: string[];
}

export interface PatchPlanBody {
  name?: string;
  description?: string | null;
  redemptionMode?: RedemptionMode;
  variant?: SubscriptionVariant;
  validityDays?: number;
  maxPickups?: number;
  kgLimit?: number | null;
  itemsLimit?: number | null;
  pricePaise?: number;
  active?: boolean;
  applicableServiceTypes?: string[];
  branchIds?: string[];
}
