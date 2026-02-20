/**
 * T3: Prevent double deduction for same order (idempotency).
 * - SubscriptionUsage already exists for orderId.
 * - applySubscriptionToOrder again for same orderId: no decrement, success/no-op.
 */
import { OrderStatus, ServiceType } from '@shared/enums';
import { applySubscriptionToOrder } from '../orders/apply-subscription-to-order.use-case';
import { createFakeOrdersRepo, createFakeSubscriptionsRepo, createFakeSubscriptionUsageRepo } from './fakes/in-memory-repos';

describe('T3: Prevent double subscription deduction for same order', () => {
  const orderId = 'order-1';
  const subscriptionId = 'sub-1';
  const ordersRepo = createFakeOrdersRepo([
    {
      id: orderId,
      userId: 'user-1',
      serviceType: ServiceType.WASH_FOLD,
      addressId: 'addr-1',
      pincode: '500081',
      pickupDate: new Date(),
      timeWindow: '10:00-12:00',
      estimatedWeightKg: 4,
      actualWeightKg: null,
      status: OrderStatus.BOOKING_CONFIRMED,
      subscriptionId,
      paymentStatus: 'PENDING',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ] as any);

  const subscription = {
    id: subscriptionId,
    userId: 'user-1',
    planId: 'plan-1',
    remainingPickups: 1,
    usedKg: 0,
    usedItemsCount: 0,
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    active: true,
  };
  const subscriptionsRepo = createFakeSubscriptionsRepo([subscription]);

  const existingUsage = {
    id: 'usage-1',
    subscriptionId,
    orderId,
    invoiceId: null as string | null,
    deductedPickups: 1,
    deductedKg: 0,
    deductedItemsCount: 0,
    createdAt: new Date(),
  };
  const subscriptionUsageRepo = createFakeSubscriptionUsageRepo([existingUsage]);

  const deps = { ordersRepo, subscriptionsRepo, subscriptionUsageRepo };

  it('returns applied: false and does NOT decrement remainingPickups when usage already exists', async () => {
    const result = await applySubscriptionToOrder(
      { orderId, subscriptionId },
      deps,
    );

    expect(result.applied).toBe(false);
    const subAfter = subscriptionsRepo.records.find((s) => s.id === subscriptionId);
    expect(subAfter!.remainingPickups).toBe(1);
    expect(subscriptionUsageRepo.records).toHaveLength(1);
  });
});
