import { AppError, isAppError } from '../errors';
import type { OrdersRepo, SubscriptionsRepo, SubscriptionUsageRepo, SubscriptionPlansRepo } from '../ports';
import {
  assertSubscriptionDeductionAllowed,
  isSubscriptionExhausted,
} from '../subscriptions/subscription-deduct-assert.use-case';

export interface ApplySubscriptionToOrderParams {
  orderId: string;
  subscriptionId: string;
  /** ACK invoice id; when set, idempotency is per-invoice (one usage per invoice+subscription). */
  invoiceId?: string;
  /** Weight collected at pickup (kg). When provided, used for subscription usedKg. */
  weightKg?: number;
  /** Items collected at pickup. When provided, used for subscription usedItemsCount. */
  itemsCount?: number;
}

export interface ApplySubscriptionToOrderDeps {
  ordersRepo: OrdersRepo;
  subscriptionsRepo: SubscriptionsRepo;
  subscriptionUsageRepo: SubscriptionUsageRepo;
  subscriptionPlansRepo?: SubscriptionPlansRepo;
}

/**
 * Idempotent: if usage already exists for this orderId, does not deduct again.
 * Deducts 1 pickup and optionally weightKg/itemsCount (updates subscription usedKg/usedItemsCount).
 */
export async function applySubscriptionToOrder(
  params: ApplySubscriptionToOrderParams,
  deps: ApplySubscriptionToOrderDeps,
): Promise<{ applied: boolean }> {
  const { ordersRepo, subscriptionsRepo, subscriptionUsageRepo } = deps;

  if (params.invoiceId) {
    const existingByInvoice = await subscriptionUsageRepo.findByInvoiceIdAndSubscriptionId(params.invoiceId, params.subscriptionId);
    if (existingByInvoice) {
      return { applied: false };
    }
  } else {
    const existingUsage = await subscriptionUsageRepo.findByOrderIdAndSubscriptionId(params.orderId, params.subscriptionId);
    if (existingUsage) {
      return { applied: false };
    }
  }

  const order = await ordersRepo.getById(params.orderId);
  if (!order) {
    throw new AppError('SUBSCRIPTION_EXPIRED', 'Order not found');
  }

  const sub = await subscriptionsRepo.getById(params.subscriptionId);
  if (!sub || !sub.active || sub.expiryDate < new Date()) {
    throw new AppError('SUBSCRIPTION_EXPIRED', 'Subscription not found or expired');
  }

  const weightKg = params.weightKg ?? 0;
  const itemsCount = params.itemsCount ?? 0;

  // When no pickups left but weight/items still within limit: allow one final "closure" invoice (deduct 0 pickups, only kg/items).
  const noPickupsLeft = sub.remainingPickups < 1;
  const deduct =
    noPickupsLeft && (weightKg > 0 || itemsCount > 0)
      ? { deductedPickups: 0, deductedKg: weightKg, deductedItemsCount: itemsCount }
      : { deductedPickups: 1, deductedKg: weightKg, deductedItemsCount: itemsCount };

  if (noPickupsLeft && deduct.deductedPickups > 0) {
    throw new AppError('NO_REMAINING_PICKUPS', 'No pickups remaining');
  }

  if (deps.subscriptionPlansRepo) {
    const plan = await deps.subscriptionPlansRepo.getById(sub.planId);
    if (plan) {
      assertSubscriptionDeductionAllowed(sub, { maxPickups: plan.maxPickups, kgLimit: plan.kgLimit, itemsLimit: plan.itemsLimit }, deduct);
    }
  }

  try {
    await subscriptionUsageRepo.create({
      subscriptionId: params.subscriptionId,
      orderId: params.orderId,
      invoiceId: params.invoiceId ?? null,
      deductedPickups: deduct.deductedPickups,
      deductedKg: deduct.deductedKg,
      deductedItemsCount: deduct.deductedItemsCount,
    });
  } catch (e: unknown) {
    if (isAppError(e) && e.code === 'UNIQUE_CONSTRAINT') {
      return { applied: false };
    }
    throw e;
  }
  await subscriptionsRepo.updateUsage(params.subscriptionId, {
    remainingPickups: sub.remainingPickups - deduct.deductedPickups,
    usedKg: Number(sub.usedKg) + weightKg,
    usedItemsCount: sub.usedItemsCount + itemsCount,
  });

  // If subscription is now fully utilized (validity/limits/pickups exhausted), set inactive
  if (deps.subscriptionPlansRepo) {
    const updated = await subscriptionsRepo.getById(params.subscriptionId);
    const plan = await deps.subscriptionPlansRepo.getById(updated!.planId);
    if (updated && plan && isSubscriptionExhausted(updated, { maxPickups: plan.maxPickups, kgLimit: plan.kgLimit, itemsLimit: plan.itemsLimit })) {
      await subscriptionsRepo.setInactive(params.subscriptionId);
    }
  }
  return { applied: true };
}
