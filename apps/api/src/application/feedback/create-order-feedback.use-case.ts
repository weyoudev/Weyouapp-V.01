import { FeedbackType } from '@shared/enums';
import { OrderStatus } from '@shared/enums';
import { AppError } from '../errors';
import type { FeedbackRepo, OrdersRepo, FeedbackRecord } from '../ports';

const MIN_RATING = 1;
const MAX_RATING = 5;

export interface CreateOrderFeedbackInput {
  userId: string;
  orderId: string;
  rating: number;
  tags?: string[];
  message?: string | null;
}

export interface CreateOrderFeedbackDeps {
  feedbackRepo: FeedbackRepo;
  ordersRepo: OrdersRepo;
}

/**
 * Creates ORDER feedback. Allowed only when order is DELIVERED and payment CAPTURED.
 * Enforces one feedback per order. Order must belong to userId.
 */
export async function createOrderFeedback(
  input: CreateOrderFeedbackInput,
  deps: CreateOrderFeedbackDeps,
): Promise<FeedbackRecord> {
  if (input.rating < MIN_RATING || input.rating > MAX_RATING) {
    throw new AppError('FEEDBACK_INVALID', `Rating must be between ${MIN_RATING} and ${MAX_RATING}`, {
      rating: input.rating,
    });
  }

  const order = await deps.ordersRepo.getById(input.orderId);
  if (!order) {
    throw new AppError('ORDER_NOT_FOUND', 'Order not found', { orderId: input.orderId });
  }
  if (order.userId !== input.userId) {
    throw new AppError('FEEDBACK_ACCESS_DENIED', 'You can only submit feedback for your own orders');
  }
  if (order.status !== OrderStatus.DELIVERED) {
    throw new AppError(
      'FEEDBACK_NOT_ALLOWED',
      'Feedback is only allowed for delivered orders',
      { status: order.status },
    );
  }
  if (order.paymentStatus !== 'CAPTURED') {
    throw new AppError(
      'FEEDBACK_NOT_ALLOWED',
      'Feedback is only allowed after payment is captured',
      { paymentStatus: order.paymentStatus },
    );
  }

  const existing = await deps.feedbackRepo.getByOrderId(input.orderId);
  if (existing) {
    throw new AppError('FEEDBACK_ALREADY_EXISTS', 'Feedback already submitted for this order', {
      orderId: input.orderId,
    });
  }

  return deps.feedbackRepo.create({
    userId: input.userId,
    orderId: input.orderId,
    type: FeedbackType.ORDER,
    rating: input.rating,
    tags: input.tags ?? [],
    message: input.message ?? null,
  });
}
