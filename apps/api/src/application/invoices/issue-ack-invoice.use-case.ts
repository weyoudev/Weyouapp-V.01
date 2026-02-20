import { OrderStatus } from '@shared/enums';
import { AppError } from '../errors';
import type { OrdersRepo } from '../ports';

/** ACK can be created/issued before pickup (when order is confirmed or still booking). */
const ACK_ALLOWED_STATUSES: OrderStatus[] = [
  OrderStatus.BOOKING_CONFIRMED,
  OrderStatus.PICKUP_SCHEDULED,
  OrderStatus.PICKED_UP,
  OrderStatus.IN_PROCESSING,
  OrderStatus.READY,
  OrderStatus.OUT_FOR_DELIVERY,
  OrderStatus.DELIVERED,
];

export interface IssueAckInvoiceDeps {
  ordersRepo: OrdersRepo;
}

/**
 * Validates that an acknowledgement invoice can be created/issued for the order.
 * ACK is allowed from BOOKING_CONFIRMED onward (including before pickup).
 */
export async function assertCanIssueAcknowledgementInvoice(
  orderId: string,
  deps: IssueAckInvoiceDeps,
): Promise<void> {
  const order = await deps.ordersRepo.getById(orderId);
  if (!order) {
    throw new AppError('INVOICE_NOT_FOUND', 'Order not found');
  }
  if (!ACK_ALLOWED_STATUSES.includes(order.status)) {
    throw new AppError(
      'ACK_INVOICE_NOT_ALLOWED',
      `Acknowledgement invoice not allowed for status: ${order.status}`,
      { orderId, status: order.status },
    );
  }
}
