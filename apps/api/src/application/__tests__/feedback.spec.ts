/**
 * Feedback use-case tests:
 * - Cannot submit order feedback unless DELIVERED + CAPTURED => FEEDBACK_NOT_ALLOWED
 * - Cannot submit second feedback for same order => FEEDBACK_ALREADY_EXISTS
 * - Customer cannot submit feedback for other customer's order => FEEDBACK_ACCESS_DENIED
 * - General feedback works without orderId
 */
import { OrderStatus } from '@shared/enums';
import { AppError } from '../errors';
import { createOrderFeedback } from '../feedback/create-order-feedback.use-case';
import { createGeneralFeedback } from '../feedback/create-general-feedback.use-case';
import { createFakeOrdersRepo, createFakeFeedbackRepo } from './fakes/in-memory-repos';

describe('Feedback use-cases', () => {
  const userId = 'user-1';
  const orderId = 'order-1';

  it('throws FEEDBACK_NOT_ALLOWED when order is not DELIVERED', async () => {
    const ordersRepo = createFakeOrdersRepo([
      {
        id: orderId,
        userId,
        serviceType: 'WASH_FOLD' as any,
        addressId: 'a1',
        pincode: '500081',
        pickupDate: new Date(),
        timeWindow: '10:00-12:00',
        estimatedWeightKg: 5,
        actualWeightKg: null,
        status: OrderStatus.PICKED_UP,
        subscriptionId: null,
        paymentStatus: 'CAPTURED',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    const feedbackRepo = createFakeFeedbackRepo();

    await expect(
      createOrderFeedback(
        { userId, orderId, rating: 5, message: 'Good' },
        { ordersRepo, feedbackRepo },
      ),
    ).rejects.toMatchObject({ code: 'FEEDBACK_NOT_ALLOWED' });
  });

  it('throws FEEDBACK_NOT_ALLOWED when payment is not CAPTURED', async () => {
    const ordersRepo = createFakeOrdersRepo([
      {
        id: orderId,
        userId,
        serviceType: 'WASH_FOLD' as any,
        addressId: 'a1',
        pincode: '500081',
        pickupDate: new Date(),
        timeWindow: '10:00-12:00',
        estimatedWeightKg: 5,
        actualWeightKg: null,
        status: OrderStatus.DELIVERED,
        subscriptionId: null,
        paymentStatus: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    const feedbackRepo = createFakeFeedbackRepo();

    await expect(
      createOrderFeedback(
        { userId, orderId, rating: 5 },
        { ordersRepo, feedbackRepo },
      ),
    ).rejects.toMatchObject({ code: 'FEEDBACK_NOT_ALLOWED' });
  });

  it('throws FEEDBACK_ALREADY_EXISTS when submitting second feedback for same order', async () => {
    const ordersRepo = createFakeOrdersRepo([
      {
        id: orderId,
        userId,
        serviceType: 'WASH_FOLD' as any,
        addressId: 'a1',
        pincode: '500081',
        pickupDate: new Date(),
        timeWindow: '10:00-12:00',
        estimatedWeightKg: 5,
        actualWeightKg: null,
        status: OrderStatus.DELIVERED,
        subscriptionId: null,
        paymentStatus: 'CAPTURED',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    const feedbackRepo = createFakeFeedbackRepo([
      {
        id: 'fb-1',
        userId,
        orderId,
        type: 'ORDER',
        rating: 5,
        tags: [],
        message: null,
        status: 'NEW',
        adminNotes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    await expect(
      createOrderFeedback(
        { userId, orderId, rating: 4 },
        { ordersRepo, feedbackRepo },
      ),
    ).rejects.toMatchObject({ code: 'FEEDBACK_ALREADY_EXISTS' });
  });

  it('throws FEEDBACK_ACCESS_DENIED when order belongs to another user', async () => {
    const otherUser = 'user-2';
    const ordersRepo = createFakeOrdersRepo([
      {
        id: orderId,
        userId: otherUser,
        serviceType: 'WASH_FOLD' as any,
        addressId: 'a1',
        pincode: '500081',
        pickupDate: new Date(),
        timeWindow: '10:00-12:00',
        estimatedWeightKg: 5,
        actualWeightKg: null,
        status: OrderStatus.DELIVERED,
        subscriptionId: null,
        paymentStatus: 'CAPTURED',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    const feedbackRepo = createFakeFeedbackRepo();

    await expect(
      createOrderFeedback(
        { userId, orderId, rating: 5 },
        { ordersRepo, feedbackRepo },
      ),
    ).rejects.toMatchObject({ code: 'FEEDBACK_ACCESS_DENIED' });
  });

  it('creates order feedback when DELIVERED + CAPTURED', async () => {
    const ordersRepo = createFakeOrdersRepo([
      {
        id: orderId,
        userId,
        serviceType: 'WASH_FOLD' as any,
        addressId: 'a1',
        pincode: '500081',
        pickupDate: new Date(),
        timeWindow: '10:00-12:00',
        estimatedWeightKg: 5,
        actualWeightKg: null,
        status: OrderStatus.DELIVERED,
        subscriptionId: null,
        paymentStatus: 'CAPTURED',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    const feedbackRepo = createFakeFeedbackRepo();

    const result = await createOrderFeedback(
      { userId, orderId, rating: 5, tags: ['quality'], message: 'Great!' },
      { ordersRepo, feedbackRepo },
    );

    expect(result.type).toBe('ORDER');
    expect(result.rating).toBe(5);
    expect(result.orderId).toBe(orderId);
    expect(result.userId).toBe(userId);
    expect(feedbackRepo.records).toHaveLength(1);
  });

  it('general feedback works without orderId', async () => {
    const feedbackRepo = createFakeFeedbackRepo();

    const result = await createGeneralFeedback(
      { userId, rating: 4, tags: ['app'], message: 'Nice app' },
      { feedbackRepo },
    );

    expect(result.type).toBe('GENERAL');
    expect(result.rating).toBe(4);
    expect(result.orderId).toBeNull();
    expect(result.userId).toBe(userId);
  });

  it('throws FEEDBACK_INVALID for rating out of range', async () => {
    const feedbackRepo = createFakeFeedbackRepo();

    await expect(
      createGeneralFeedback(
        { userId, rating: 0 },
        { feedbackRepo },
      ),
    ).rejects.toMatchObject({ code: 'FEEDBACK_INVALID' });

    await expect(
      createGeneralFeedback(
        { userId, rating: 6 },
        { feedbackRepo },
      ),
    ).rejects.toMatchObject({ code: 'FEEDBACK_INVALID' });
  });
});
