import { OrderStatus } from '@shared/enums';
import { AppError } from '../errors';
import { isAllowedTransition } from './order-status-transitions';
import type { OrdersRepo } from '../ports';

export interface UpdateOrderStatusParams {
  orderId: string;
  toStatus: OrderStatus;
  /** When toStatus is CANCELLED, optional reason (e.g. customer request during pickup). */
  cancellationReason?: string | null;
}

export interface UpdateOrderStatusDeps {
  ordersRepo: OrdersRepo;
}

export async function updateOrderStatus(
  params: UpdateOrderStatusParams,
  deps: UpdateOrderStatusDeps,
): Promise<{ orderId: string; status: OrderStatus }> {
  const { ordersRepo } = deps;
  const order = await ordersRepo.getById(params.orderId);
  if (!order) {
    throw new AppError('INVALID_STATUS_TRANSITION', 'Order not found');
  }
  const from = order.status as OrderStatus;
  const to = params.toStatus;
  if (!isAllowedTransition(from, to)) {
    throw new AppError(
      'INVALID_STATUS_TRANSITION',
      `Transition from ${from} to ${to} is not allowed`,
      { from, to },
    );
  }
  const updated = await ordersRepo.updateStatus(params.orderId, to, {
    cancellationReason: to === OrderStatus.CANCELLED ? params.cancellationReason : undefined,
  });
  return { orderId: updated.id, status: updated.status as OrderStatus };
}
