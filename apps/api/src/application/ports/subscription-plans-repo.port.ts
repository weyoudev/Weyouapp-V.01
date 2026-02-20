import type { SubscriptionVariant } from '@shared/enums';

export type RedemptionMode = 'MULTI_USE' | 'SINGLE_USE';

export interface SubscriptionPlanRecord {
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
  /** Empty array = plan applies to all branches. Non-empty = plan applies only to these branch IDs. */
  branchIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSubscriptionPlanInput {
  name: string;
  description?: string | null;
  redemptionMode?: RedemptionMode;
  variant: SubscriptionVariant;
  validityDays: number;
  maxPickups: number;
  kgLimit?: number | null;
  itemsLimit?: number | null;
  minKgPerPickup?: number | null;
  pricePaise: number;
  applicableServiceTypes?: string[];
  active?: boolean;
  /** Empty or missing = all branches. Non-empty = plan applies only to these branch IDs. */
  branchIds?: string[];
}

export interface UpdateSubscriptionPlanPatch {
  name?: string;
  description?: string | null;
  redemptionMode?: RedemptionMode;
  variant?: SubscriptionVariant;
  validityDays?: number;
  maxPickups?: number;
  kgLimit?: number | null;
  itemsLimit?: number | null;
  minKgPerPickup?: number | null;
  pricePaise?: number;
  applicableServiceTypes?: string[];
  active?: boolean;
  branchIds?: string[];
}

export interface SubscriptionPlansRepo {
  create(plan: CreateSubscriptionPlanInput): Promise<SubscriptionPlanRecord>;
  update(id: string, patch: UpdateSubscriptionPlanPatch): Promise<SubscriptionPlanRecord>;
  getById(id: string): Promise<SubscriptionPlanRecord | null>;
  listAll(): Promise<SubscriptionPlanRecord[]>;
  listActive(): Promise<SubscriptionPlanRecord[]>;
}
