import { InvoiceType, PaymentProvider, PaymentStatus } from '@shared/enums';
import { AppError } from '../errors';
import type {
  OrdersRepo,
  InvoicesRepo,
  SubscriptionsRepo,
  SubscriptionPlansRepo,
  PaymentsRepo,
} from '../ports';

export interface FulfillNewSubscriptionsFromAckDeps {
  ordersRepo: OrdersRepo;
  invoicesRepo: InvoicesRepo;
  subscriptionsRepo: SubscriptionsRepo;
  subscriptionPlansRepo: SubscriptionPlansRepo;
  paymentsRepo: PaymentsRepo;
}

type NewSnap = {
  planId: string;
  planName: string;
  validityStartDate: string;
  pricePaise: number;
  quantityMonths?: number;
};

/**
 * When payment is recorded for an order, create/activate new subscriptions that were on the ACK invoice.
 * New subscriptions on ACK are for reference only; they are added to the customer profile only after Final invoice and payment.
 * Idempotent: if newSubscriptionFulfilledAt is already set on the ACK invoice, does nothing.
 */
export async function fulfillNewSubscriptionsFromAckInvoice(
  orderId: string,
  deps: FulfillNewSubscriptionsFromAckDeps,
): Promise<{ fulfilled: boolean }> {
  const ack = await deps.invoicesRepo.getByOrderIdAndType(orderId, InvoiceType.ACKNOWLEDGEMENT);
  if (!ack || ack.newSubscriptionFulfilledAt != null) {
    return { fulfilled: false };
  }
  const rawSnap = ack.newSubscriptionSnapshotJson;
  const newSnapList: NewSnap[] = Array.isArray(rawSnap)
    ? rawSnap
    : rawSnap && (rawSnap as NewSnap).planId
      ? [rawSnap as NewSnap]
      : [];
  if (newSnapList.length === 0) {
    return { fulfilled: false };
  }

  const order = await deps.ordersRepo.getById(orderId);
  if (!order) return { fulfilled: false };

  let firstSubscriptionId: string | null = null;
  for (const newSnap of newSnapList) {
    const quantity = Math.min(12, Math.max(1, newSnap?.quantityMonths ?? 1));
    if (!newSnap?.planId || !newSnap?.validityStartDate) continue;
    const plan = await deps.subscriptionPlansRepo.getById(newSnap.planId);
    if (!plan) continue;
    if (plan.redemptionMode === 'SINGLE_USE') {
      const alreadyRedeemed = await deps.subscriptionsRepo.hasEverRedeemedPlan(order.userId, plan.id);
      if (alreadyRedeemed) {
        throw new AppError(
          'SUBSCRIPTION_PLAN_ALREADY_REDEEMED',
          'This offer can be used only once per customer.',
          { planId: plan.id, userId: order.userId },
        );
      }
    }
    const existingActive = await deps.subscriptionsRepo.findActiveByUserIdAndPlanId(order.userId, plan.id);
    if (existingActive) {
      await deps.subscriptionsRepo.extendSubscription(existingActive.id, {
        quantityMonths: quantity,
        planMaxPickups: plan.maxPickups,
        planValidityDays: plan.validityDays,
        planKgLimit: plan.kgLimit,
        planItemsLimit: plan.itemsLimit,
      });
      if (!firstSubscriptionId) firstSubscriptionId = existingActive.id;
      await deps.paymentsRepo.upsertForSubscription({
        subscriptionId: existingActive.id,
        provider: PaymentProvider.UPI,
        status: PaymentStatus.CAPTURED,
        amount: newSnap.pricePaise,
      });
    } else {
      const validityStartDate = new Date(newSnap.validityStartDate);
      const expiryDate = new Date(validityStartDate);
      expiryDate.setDate(expiryDate.getDate() + plan.validityDays * quantity);
      const totalPickups = plan.maxPickups * quantity;
      const totalKg = plan.kgLimit != null ? plan.kgLimit * quantity : null;
      const totalItems = plan.itemsLimit != null ? plan.itemsLimit * quantity : null;
      const sub = await deps.subscriptionsRepo.create({
        userId: order.userId,
        planId: plan.id,
        branchId: (order as { branchId?: string | null }).branchId ?? null,
        validityStartDate,
        expiryDate,
        remainingPickups: totalPickups,
        totalMaxPickups: totalPickups,
        totalKgLimit: totalKg,
        totalItemsLimit: totalItems,
      });
      if (!firstSubscriptionId) firstSubscriptionId = sub.id;
      await deps.paymentsRepo.upsertForSubscription({
        subscriptionId: sub.id,
        provider: PaymentProvider.UPI,
        status: PaymentStatus.CAPTURED,
        amount: newSnap.pricePaise,
      });
    }
  }
  if (firstSubscriptionId) {
    await deps.ordersRepo.updateSubscriptionId(orderId, firstSubscriptionId);
  }
  await deps.invoicesRepo.setNewSubscriptionFulfilledAt(ack.id, new Date());
  return { fulfilled: true };
}
