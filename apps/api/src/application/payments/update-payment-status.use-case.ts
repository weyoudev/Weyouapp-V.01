import { AppError } from '../errors';
import type { PaymentProvider } from '@shared/enums';
import type { PaymentStatus } from '@shared/enums';
import type { UnitOfWork, OrdersRepo, PaymentsRepo } from '../ports';

export interface UpdatePaymentStatusInput {
  orderId: string;
  provider: PaymentProvider;
  status: PaymentStatus;
  amount: number;
  providerPaymentId?: string | null;
  providerOrderId?: string | null;
  failureReason?: string | null;
}

export interface UpdatePaymentStatusDeps {
  unitOfWork: UnitOfWork;
  ordersRepo: OrdersRepo;
  paymentsRepo: PaymentsRepo;
}

/**
 * Updates payment for order and order.paymentStatus in a single transaction.
 * Validates amount >= 0.
 */
export async function updatePaymentStatus(
  input: UpdatePaymentStatusInput,
  deps: UpdatePaymentStatusDeps,
): Promise<{ paymentId: string; orderPaymentStatus: string }> {
  if (input.amount < 0) {
    throw new AppError('PAYMENT_INVALID', 'Amount must be non-negative', { amount: input.amount });
  }

  const order = await deps.ordersRepo.getById(input.orderId);
  if (!order) {
    throw new AppError('ORDER_NOT_FOUND', 'Order not found', { orderId: input.orderId });
  }

  return deps.unitOfWork.runInTransaction(async (repos) => {
    const payment = await repos.paymentsRepo.upsertForOrder({
      orderId: input.orderId,
      provider: input.provider,
      status: input.status,
      amount: input.amount,
      providerPaymentId: input.providerPaymentId,
      providerOrderId: input.providerOrderId,
      failureReason: input.failureReason,
    });
    await repos.ordersRepo.updatePaymentStatus(input.orderId, payment.status);
    return {
      paymentId: payment.id,
      orderPaymentStatus: payment.status,
    };
  });
}
