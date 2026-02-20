/**
 * Create order: orderType (INDIVIDUAL / SUBSCRIPTION), slot-in-past, and validation.
 */
import { ServiceType, OrderType, OrderStatus } from '@shared/enums';
import { AppError, isAppError } from '../errors';
import { createOrder } from '../orders/create-order.use-case';
import {
  createFakeOrdersRepo,
  createFakeSubscriptionsRepo,
  createFakeSubscriptionUsageRepo,
  createFakeServiceAreaRepo,
  createFakeSlotConfigRepo,
  createFakeHolidaysRepo,
  createFakeOperatingHoursRepo,
} from './fakes/in-memory-repos';

const futureDate = new Date(Date.now() + 86400000 * 2);
const yesterday = new Date(Date.now() - 86400000);

const baseDeps = {
  ordersRepo: createFakeOrdersRepo(),
  subscriptionsRepo: createFakeSubscriptionsRepo(),
  subscriptionUsageRepo: createFakeSubscriptionUsageRepo(),
  unitOfWork: undefined,
  serviceAreaRepo: createFakeServiceAreaRepo(new Set(['500081'])),
  slotConfigRepo: createFakeSlotConfigRepo({
    slot: {
      id: 'slot-1',
      date: futureDate,
      timeWindow: '10:00-12:00',
      pincode: '500081',
      capacity: 10,
    },
    existingCount: 0,
  }),
  holidaysRepo: createFakeHolidaysRepo(),
  operatingHoursRepo: createFakeOperatingHoursRepo(),
};

const baseParams = {
  userId: 'user-1',
  addressId: 'addr-1',
  pincode: '500081',
  pickupDate: futureDate,
  timeWindow: '10:00-12:00',
  estimatedWeightKg: 3,
};

describe('Create order – orderType and slot-in-past', () => {
  it('throws SLOT_IN_THE_PAST when pickup date/time is in the past', async () => {
    await expect(
      createOrder(
        {
          ...baseParams,
          serviceType: ServiceType.WASH_FOLD,
          pickupDate: yesterday,
          timeWindow: '10:00-12:00',
        },
        baseDeps,
      ),
    ).rejects.toMatchObject({ code: 'SLOT_IN_THE_PAST' });
  });

  it('INDIVIDUAL with subscriptionId throws INDIVIDUAL_NO_SUBSCRIPTION', async () => {
    await expect(
      createOrder(
        {
          ...baseParams,
          orderType: OrderType.INDIVIDUAL,
          serviceType: ServiceType.WASH_FOLD,
          subscriptionId: 'sub-1',
        },
        baseDeps,
      ),
    ).rejects.toMatchObject({ code: 'INDIVIDUAL_NO_SUBSCRIPTION' });
  });

  it('INDIVIDUAL with no services throws SERVICES_REQUIRED', async () => {
    let err: unknown;
    try {
      await createOrder(
        {
          ...baseParams,
          orderType: OrderType.INDIVIDUAL,
          serviceType: ServiceType.WASH_FOLD,
          services: [],
        },
        { ...baseDeps, ordersRepo: createFakeOrdersRepo() },
      );
    } catch (e) {
      err = e;
    }
    expect(isAppError(err)).toBe(true);
    expect((err as AppError).code).toBe('SERVICES_REQUIRED');
  });

  it('SUBSCRIPTION without subscriptionId throws SUBSCRIPTION_REQUIRED', async () => {
    await expect(
      createOrder(
        {
          ...baseParams,
          orderType: OrderType.SUBSCRIPTION,
          serviceType: ServiceType.WASH_FOLD,
          subscriptionId: undefined,
        },
        baseDeps,
      ),
    ).rejects.toMatchObject({ code: 'SUBSCRIPTION_REQUIRED' });
  });

  it('SUBSCRIPTION throws SUBSCRIPTION_HAS_ACTIVE_ORDER when subscription already has an active order', async () => {
    const subsRepo = createFakeSubscriptionsRepo([
      {
        id: 'sub-1',
        userId: 'user-1',
        planId: 'plan-1',
        remainingPickups: 5,
        expiryDate: new Date(Date.now() + 86400000 * 30),
        active: true,
      },
    ]);
    const existingOrder = {
      id: 'order-existing',
      userId: 'user-1',
      orderType: OrderType.SUBSCRIPTION as const,
      serviceType: ServiceType.WASH_FOLD,
      serviceTypes: [ServiceType.WASH_FOLD],
      addressId: 'addr-1',
      pincode: '500081',
      pickupDate: futureDate,
      timeWindow: '10:00-12:00',
      estimatedWeightKg: 3,
      actualWeightKg: null,
      status: OrderStatus.BOOKING_CONFIRMED,
      subscriptionId: 'sub-1',
      paymentStatus: 'PENDING',
      createdAt: new Date(),
      updatedAt: new Date(),
      confirmedAt: null,
      pickedUpAt: null,
      inProgressAt: null,
      readyAt: null,
      outForDeliveryAt: null,
      deliveredAt: null,
    };
    const ordersRepo = createFakeOrdersRepo([existingOrder]);
    await expect(
      createOrder(
        {
          ...baseParams,
          orderType: OrderType.SUBSCRIPTION,
          serviceType: ServiceType.WASH_FOLD,
          subscriptionId: 'sub-1',
          estimatedWeightKg: 3,
        },
        { ...baseDeps, ordersRepo, subscriptionsRepo: subsRepo },
      ),
    ).rejects.toMatchObject({ code: 'SUBSCRIPTION_HAS_ACTIVE_ORDER' });
  });

  it('SUBSCRIPTION with active subscription succeeds and sets orderType', async () => {
    const subsRepo = createFakeSubscriptionsRepo([
      {
        id: 'sub-1',
        userId: 'user-1',
        planId: 'plan-1',
        remainingPickups: 5,
        expiryDate: new Date(Date.now() + 86400000 * 30),
        active: true,
      },
    ]);
    const ordersRepo = createFakeOrdersRepo();
    const result = await createOrder(
      {
        ...baseParams,
        orderType: OrderType.SUBSCRIPTION,
        serviceType: ServiceType.WASH_FOLD,
        subscriptionId: 'sub-1',
        estimatedWeightKg: 3,
      },
      { ...baseDeps, ordersRepo, subscriptionsRepo: subsRepo },
    );
    expect(result.orderId).toBeDefined();
    expect(ordersRepo.records).toHaveLength(1);
    expect(ordersRepo.records[0].orderType).toBe(OrderType.SUBSCRIPTION);
    expect(ordersRepo.records[0].subscriptionId).toBe('sub-1');
  });

  it('INDIVIDUAL success with orderType and selectedServices', async () => {
    const ordersRepo = createFakeOrdersRepo();
    const result = await createOrder(
      {
        ...baseParams,
        orderType: OrderType.INDIVIDUAL,
        serviceType: ServiceType.WASH_FOLD,
        services: [ServiceType.WASH_FOLD, ServiceType.DRY_CLEAN],
      },
      { ...baseDeps, ordersRepo },
    );
    expect(result.orderId).toBeDefined();
    expect(ordersRepo.records[0].orderType).toBe(OrderType.INDIVIDUAL);
    expect(ordersRepo.records[0].serviceTypes).toContain(ServiceType.WASH_FOLD);
    expect(ordersRepo.records[0].serviceTypes).toContain(ServiceType.DRY_CLEAN);
  });
});
