import type { SubscriptionPlansRepo, SubscriptionsRepo } from '../ports';

export interface AvailablePlanItem {
  id: string;
  name: string;
  description: string | null;
  redemptionMode: string;
  variant: string;
  validityDays: number;
  maxPickups: number;
  kgLimit: number | null;
  itemsLimit: number | null;
  pricePaise: number;
  isRedeemable: boolean;
  reason?: 'ALREADY_REDEEMED';
  /** Empty = plan applies to all branches. Non-empty = plan only for these branch IDs. */
  branchIds: string[];
}

export interface ListAvailablePlansForCustomerDeps {
  subscriptionPlansRepo: SubscriptionPlansRepo;
  subscriptionsRepo: SubscriptionsRepo;
}

export async function listAvailablePlansForCustomer(
  userId: string,
  deps: ListAvailablePlansForCustomerDeps,
): Promise<AvailablePlanItem[]> {
  const plans = await deps.subscriptionPlansRepo.listActive();
  const result: AvailablePlanItem[] = [];
  for (const plan of plans) {
    let isRedeemable = true;
    let reason: 'ALREADY_REDEEMED' | undefined;
    const activeSubscriptionForPlan = await deps.subscriptionsRepo.findActiveByUserIdAndPlanId(userId, plan.id);
    if (activeSubscriptionForPlan) {
      isRedeemable = false;
      reason = 'ALREADY_REDEEMED';
    }
    result.push({
      id: plan.id,
      name: plan.name,
      description: plan.description,
      redemptionMode: plan.redemptionMode,
      variant: plan.variant,
      validityDays: plan.validityDays,
      maxPickups: plan.maxPickups,
      kgLimit: plan.kgLimit,
      itemsLimit: plan.itemsLimit,
      pricePaise: plan.pricePaise,
      isRedeemable,
      branchIds: plan.branchIds ?? [],
      ...(reason && { reason }),
    });
  }
  return result;
}
