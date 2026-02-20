/**
 * ACK issue subscription rules:
 * - Allow issue when remaining becomes exactly 0 after this invoice; then set subscription inactive.
 * - Block when remainingBefore <= 0 (subscription not usable) or remainingAfter < 0 (would exceed).
 */
import { OrderStatus, ServiceType } from '@shared/enums';
import { applySubscriptionToOrder } from '../orders/apply-subscription-to-order.use-case';
import {
  createFakeOrdersRepo,
  createFakeSubscriptionsRepo,
  createFakeSubscriptionUsageRepo,
} from './fakes/in-memory-repos';
import type { SubscriptionPlansRepo } from '../ports';

const orderId = 'order-1';
const subscriptionId = 'sub-1';
const planId = 'plan-1';

function createFakePlanRepo(plan: { maxPickups: number; kgLimit: number | null; itemsLimit: number | null }): SubscriptionPlansRepo {
  return {
    getById: async (id: string) =>
      id === planId
        ? ({
            id: planId,
            maxPickups: plan.maxPickups,
            kgLimit: plan.kgLimit,
            itemsLimit: plan.itemsLimit,
          } as any)
        : null,
    create: async () => null as any,
    update: async () => null as any,
    listAll: async () => [],
    listActive: async () => [],
  };
}

const baseOrder = {
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
};

describe('Apply subscription at ACK: allow remainingAfter=0, block remainingAfter<0 or remainingBefore<=0', () => {
  it('allows issue when last pickup is used (remainingPickups 1 → 0), then sets subscription inactive', async () => {
    const ordersRepo = createFakeOrdersRepo([baseOrder as any]);
    const subscriptionsRepo = createFakeSubscriptionsRepo([
      {
        id: subscriptionId,
        userId: 'user-1',
        planId,
        remainingPickups: 1,
        usedKg: 0,
        usedItemsCount: 0,
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        active: true,
      } as any,
    ]);
    const subscriptionUsageRepo = createFakeSubscriptionUsageRepo();
    const subscriptionPlansRepo = createFakePlanRepo({ maxPickups: 1, kgLimit: null, itemsLimit: null });

    const result = await applySubscriptionToOrder(
      { orderId, subscriptionId },
      { ordersRepo, subscriptionsRepo, subscriptionUsageRepo, subscriptionPlansRepo },
    );

    expect(result.applied).toBe(true);
    const subAfter = subscriptionsRepo.records.find((s) => s.id === subscriptionId);
    expect(subAfter!.remainingPickups).toBe(0);
    expect(subAfter!.active).toBe(false);
  });

  it('allows issue when last kg is used (remainingKg 2 → 0), then sets subscription inactive', async () => {
    const ordersRepo = createFakeOrdersRepo([baseOrder as any]);
    const subscriptionsRepo = createFakeSubscriptionsRepo([
      {
        id: subscriptionId,
        userId: 'user-1',
        planId,
        remainingPickups: 5,
        usedKg: 2,
        usedItemsCount: 0,
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        active: true,
      } as any,
    ]);
    const subscriptionUsageRepo = createFakeSubscriptionUsageRepo();
    const subscriptionPlansRepo = createFakePlanRepo({ maxPickups: 10, kgLimit: 4, itemsLimit: null });

    const result = await applySubscriptionToOrder(
      { orderId, subscriptionId, weightKg: 2 },
      { ordersRepo, subscriptionsRepo, subscriptionUsageRepo, subscriptionPlansRepo },
    );

    expect(result.applied).toBe(true);
    const subAfter = subscriptionsRepo.records.find((s) => s.id === subscriptionId);
    expect(subAfter!.usedKg).toBe(4);
    expect(subAfter!.active).toBe(false);
  });

  it('blocks issue when kg would exceed (remainingKg 1, deductKg 2 → remainingAfter -1)', async () => {
    const ordersRepo = createFakeOrdersRepo([baseOrder as any]);
    const subscriptionsRepo = createFakeSubscriptionsRepo([
      {
        id: subscriptionId,
        userId: 'user-1',
        planId,
        remainingPickups: 5,
        usedKg: 3,
        usedItemsCount: 0,
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        active: true,
      } as any,
    ]);
    const subscriptionUsageRepo = createFakeSubscriptionUsageRepo();
    const subscriptionPlansRepo = createFakePlanRepo({ maxPickups: 10, kgLimit: 4, itemsLimit: null });

    await expect(
      applySubscriptionToOrder(
        { orderId, subscriptionId, weightKg: 2 },
        { ordersRepo, subscriptionsRepo, subscriptionUsageRepo, subscriptionPlansRepo },
      ),
    ).rejects.toMatchObject({ code: 'EXCEEDED_LIMIT' });
    const subAfter = subscriptionsRepo.records.find((s) => s.id === subscriptionId);
    expect(subAfter!.usedKg).toBe(3);
    expect(subscriptionUsageRepo.records).toHaveLength(0);
  });

  it('idempotent: second apply with same invoiceId returns applied: false and does not deduct again', async () => {
    const invoiceId = 'inv-ack-1';
    const ordersRepo = createFakeOrdersRepo([baseOrder as any]);
    const subscriptionsRepo = createFakeSubscriptionsRepo([
      {
        id: subscriptionId,
        userId: 'user-1',
        planId,
        remainingPickups: 2,
        usedKg: 0,
        usedItemsCount: 0,
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        active: true,
      } as any,
    ]);
    const subscriptionUsageRepo = createFakeSubscriptionUsageRepo();
    const subscriptionPlansRepo = createFakePlanRepo({ maxPickups: 10, kgLimit: 12, itemsLimit: null });

    const first = await applySubscriptionToOrder(
      { orderId, subscriptionId, invoiceId, weightKg: 6 },
      { ordersRepo, subscriptionsRepo, subscriptionUsageRepo, subscriptionPlansRepo },
    );
    expect(first.applied).toBe(true);
    expect(subscriptionsRepo.records.find((s) => s.id === subscriptionId)!.usedKg).toBe(6);

    const second = await applySubscriptionToOrder(
      { orderId, subscriptionId, invoiceId, weightKg: 6 },
      { ordersRepo, subscriptionsRepo, subscriptionUsageRepo, subscriptionPlansRepo },
    );
    expect(second.applied).toBe(false);
    expect(subscriptionsRepo.records.find((s) => s.id === subscriptionId)!.usedKg).toBe(6);
    expect(subscriptionUsageRepo.records).toHaveLength(1);
  });

  it('blocks issue when remainingPickups is 0 before (subscription already not usable)', async () => {
    const ordersRepo = createFakeOrdersRepo([baseOrder as any]);
    const subscriptionsRepo = createFakeSubscriptionsRepo([
      {
        id: subscriptionId,
        userId: 'user-1',
        planId,
        remainingPickups: 0,
        usedKg: 0,
        usedItemsCount: 0,
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        active: true,
      } as any,
    ]);
    const subscriptionUsageRepo = createFakeSubscriptionUsageRepo();
    const subscriptionPlansRepo = createFakePlanRepo({ maxPickups: 2, kgLimit: null, itemsLimit: null });

    await expect(
      applySubscriptionToOrder(
        { orderId, subscriptionId },
        { ordersRepo, subscriptionsRepo, subscriptionUsageRepo, subscriptionPlansRepo },
      ),
    ).rejects.toMatchObject({ code: 'NO_REMAINING_PICKUPS' });
    const subAfter = subscriptionsRepo.records.find((s) => s.id === subscriptionId);
    expect(subAfter!.remainingPickups).toBe(0);
    expect(subscriptionUsageRepo.records).toHaveLength(0);
  });
});
