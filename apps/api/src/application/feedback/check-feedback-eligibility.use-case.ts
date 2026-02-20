import { OrderStatus } from '@shared/enums';
import type { OrdersRepo, FeedbackRepo } from '../ports';

export interface CheckFeedbackEligibilityDeps {
  ordersRepo: OrdersRepo;
  feedbackRepo: FeedbackRepo;
}

export interface FeedbackEligibilityResult {
  eligible: boolean;
  reason?: string;
  alreadySubmitted: boolean;
}

/**
 * Returns whether the order is eligible for order feedback (DELIVERED + CAPTURED)
 * and whether feedback was already submitted. Used by GET /api/orders/:id/feedback/eligibility.
 */
export async function checkFeedbackEligibility(
  orderId: string,
  userId: string,
  deps: CheckFeedbackEligibilityDeps,
): Promise<FeedbackEligibilityResult> {
  const existing = await deps.feedbackRepo.getByOrderId(orderId);
  if (existing) {
    return { eligible: false, reason: 'Feedback already submitted for this order', alreadySubmitted: true };
  }

  const order = await deps.ordersRepo.getById(orderId);
  if (!order) {
    return { eligible: false, reason: 'Order not found', alreadySubmitted: false };
  }
  if (order.userId !== userId) {
    return { eligible: false, reason: 'Order does not belong to you', alreadySubmitted: false };
  }
  if (order.status !== OrderStatus.DELIVERED) {
    return {
      eligible: false,
      reason: `Feedback is only allowed for delivered orders (current: ${order.status})`,
      alreadySubmitted: false,
    };
  }
  if (order.paymentStatus !== 'CAPTURED') {
    return {
      eligible: false,
      reason: 'Feedback is only allowed after payment is captured',
      alreadySubmitted: false,
    };
  }

  return { eligible: true, alreadySubmitted: false };
}
