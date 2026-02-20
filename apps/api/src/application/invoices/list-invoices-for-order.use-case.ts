import { AppError } from '../errors';
import type { OrdersRepo, InvoicesRepo } from '../ports';

export interface ListInvoicesForOrderDeps {
  ordersRepo: OrdersRepo;
  invoicesRepo: InvoicesRepo;
}

/**
 * Returns invoices for an order. Caller must be the order owner (userId).
 * Throws ORDER_NOT_FOUND or ORDER_ACCESS_DENIED.
 */
export async function listInvoicesForOrder(
  orderId: string,
  userId: string,
  deps: ListInvoicesForOrderDeps,
) {
  const order = await deps.ordersRepo.getById(orderId);
  if (!order) {
    throw new AppError('ORDER_NOT_FOUND', 'Order not found', { orderId });
  }
  if (order.userId !== userId) {
    throw new AppError('ORDER_ACCESS_DENIED', 'Not allowed to view this order');
  }
  const invoices = await deps.invoicesRepo.findByOrderId(orderId);
  return invoices.map((inv) => ({
    id: inv.id,
    type: inv.type,
    status: inv.status,
    subtotal: inv.subtotal,
    tax: inv.tax,
    total: inv.total,
    discountPaise: inv.discountPaise ?? 0,
    issuedAt: inv.issuedAt,
    pdfUrl: inv.pdfUrl ?? `/api/invoices/${inv.id}/pdf`,
    items: (inv.items ?? []).map((item) => ({
      id: item.id,
      type: item.type,
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      amount: item.amount,
    })),
  }));
}
