import { AppError } from '../errors';
import type { SubscriptionRecord, SubscriptionPlanLimits } from '../ports';

export interface DeductAmounts {
  deductedPickups: number;
  deductedKg: number;
  deductedItemsCount: number;
}

/** Effective limits: subscription total* when set, else plan. */
export function getEffectiveLimits(subscription: SubscriptionRecord, plan: SubscriptionPlanLimits): { maxPickups: number; kgLimit: number | null; itemsLimit: number | null } {
  return {
    maxPickups: subscription.totalMaxPickups ?? plan.maxPickups,
    kgLimit: subscription.totalKgLimit ?? plan.kgLimit,
    itemsLimit: subscription.totalItemsLimit ?? plan.itemsLimit,
  };
}

/**
 * Asserts that a subscription can accept the given deduction (pickups, kg, items).
 * Uses subscription total* limits when set, else plan limits.
 */
export function assertSubscriptionDeductionAllowed(
  subscription: SubscriptionRecord,
  plan: SubscriptionPlanLimits,
  deduct: DeductAmounts,
): void {
  if (!subscription.active) {
    throw new AppError('SUBSCRIPTION_EXPIRED', 'Subscription is not active');
  }
  if (subscription.expiryDate < new Date()) {
    throw new AppError('SUBSCRIPTION_EXPIRED', 'Subscription has expired');
  }
  if (subscription.remainingPickups < deduct.deductedPickups) {
    throw new AppError('NO_REMAINING_PICKUPS', 'No pickups remaining on subscription');
  }
  const limits = getEffectiveLimits(subscription, plan);
  if (limits.kgLimit != null && subscription.usedKg + deduct.deductedKg > limits.kgLimit) {
    throw new AppError(
      'EXCEEDED_LIMIT',
      `Subscription kg limit exceeded (used: ${subscription.usedKg}, limit: ${limits.kgLimit})`,
    );
  }
  if (limits.itemsLimit != null && subscription.usedItemsCount + deduct.deductedItemsCount > limits.itemsLimit) {
    throw new AppError(
      'EXCEEDED_LIMIT',
      `Subscription items limit exceeded (used: ${subscription.usedItemsCount}, limit: ${limits.itemsLimit})`,
    );
  }
}

/** True when subscription is fully utilized (validity/limits/pickups exhausted). */
export function isSubscriptionExhausted(
  subscription: SubscriptionRecord,
  plan: SubscriptionPlanLimits,
): boolean {
  if (!subscription.active) return true;
  if (subscription.expiryDate < new Date()) return true;
  if (subscription.remainingPickups <= 0) return true;
  const limits = getEffectiveLimits(subscription, plan);
  if (limits.kgLimit != null && subscription.usedKg >= limits.kgLimit) return true;
  if (limits.itemsLimit != null && subscription.usedItemsCount >= limits.itemsLimit) return true;
  return false;
}
