import { OrderStatus } from '@shared/enums';
import { AppError } from '../errors';
import type { OrdersRepo } from '../ports';

export interface IssueFinalInvoiceDeps {
  ordersRepo: OrdersRepo;
}

/**
 * Validates that a final invoice can be issued for the order.
 * Final invoice can be issued when order status is OUT_FOR_DELIVERY or DELIVERED.
 * For walk-in orders (orderSource WALK_IN), READY is also allowed.
 */
export async function assertCanIssueFinalInvoice(
  orderId: string,
  deps: IssueFinalInvoiceDeps,
): Promise<void> {
  const order = await deps.ordersRepo.getById(orderId);
  if (!order) {
    throw new AppError('INVOICE_NOT_FOUND', 'Order not found');
  }
  const allowedStatuses = [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED];
  const walkInReady = order.orderSource === 'WALK_IN' && order.status === OrderStatus.READY;
  if (!allowedStatuses.includes(order.status) && !walkInReady) {
    throw new AppError(
      'FINAL_INVOICE_NOT_ALLOWED',
      `Final invoice can only be issued when order is Out for Delivery or Delivered${order.orderSource === 'WALK_IN' ? ', or Ready for walk-in orders' : ''}. Current status: ${order.status}`,
      { orderId, status: order.status },
    );
  }
}
