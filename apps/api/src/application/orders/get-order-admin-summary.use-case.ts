import { AppError } from '../errors';
import type { OrdersRepo, OrderAdminSummary } from '../ports';

export interface GetOrderAdminSummaryDeps {
  ordersRepo: OrdersRepo;
}

/**
 * Returns full admin summary for an order (customer, address, items, subscription, invoices, payment).
 * Throws if order not found.
 */
export async function getOrderAdminSummary(
  orderId: string,
  deps: GetOrderAdminSummaryDeps,
): Promise<OrderAdminSummary> {
  const summary = await deps.ordersRepo.getAdminSummary(orderId);
  if (!summary) {
    throw new AppError('ORDER_NOT_FOUND', 'Order not found', { orderId });
  }
  return summary;
}
