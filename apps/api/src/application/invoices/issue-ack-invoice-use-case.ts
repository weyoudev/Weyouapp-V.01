import { InvoiceType, InvoiceOrderMode } from '@shared/enums';
import { AppError } from '../errors';
import { assertCanIssueAcknowledgementInvoice } from './issue-ack-invoice.use-case';
import { generateAndStoreInvoicePdf } from './generate-and-store-invoice-pdf.use-case';
import { applySubscriptionToOrder } from '../orders/apply-subscription-to-order.use-case';
import type {
  OrdersRepo,
  InvoicesRepo,
  CustomersRepo,
  BrandingRepo,
  PdfGenerator,
  StorageAdapter,
  SubscriptionsRepo,
  SubscriptionUsageRepo,
  SubscriptionPlansRepo,
  PaymentsRepo,
} from '../ports';

export interface IssueAckInvoiceDeps {
  ordersRepo: OrdersRepo;
  invoicesRepo: InvoicesRepo;
  customersRepo: CustomersRepo;
  brandingRepo: BrandingRepo;
  pdfGenerator: PdfGenerator;
  storageAdapter: StorageAdapter;
  subscriptionsRepo?: SubscriptionsRepo;
  subscriptionUsageRepo?: SubscriptionUsageRepo;
  subscriptionPlansRepo?: SubscriptionPlansRepo;
  paymentsRepo?: PaymentsRepo;
}

/**
 * Issues the acknowledgement invoice: sets ISSUED, generates and stores PDF, sets pdfUrl.
 * When applySubscription is true and order has subscriptionId, deducts 1 pickup + optional weightKg/itemsCount (idempotent).
 * ACK is allowed from BOOKING_CONFIRMED onward (before or after pickup).
 */
export async function issueAckInvoice(
  orderId: string,
  deps: IssueAckInvoiceDeps,
  options?: { applySubscription?: boolean; weightKg?: number; itemsCount?: number },
): Promise<{ invoiceId: string; pdfUrl: string }> {
  await assertCanIssueAcknowledgementInvoice(orderId, { ordersRepo: deps.ordersRepo });

  const orderForSubCheck = await deps.ordersRepo.getById(orderId);
  if (orderForSubCheck?.subscriptionId) {
    const subInvoice = await deps.invoicesRepo.getBySubscriptionIdAndType(orderForSubCheck.subscriptionId, InvoiceType.SUBSCRIPTION);
    if (subInvoice && (subInvoice.paymentStatus ?? 'DUE') !== 'PAID') {
      throw new AppError(
        'SUBSCRIPTION_NOT_PAID',
        'Subscription payment must be confirmed before issuing acknowledgement invoice for this order.',
      );
    }
  }

  const existing = await deps.invoicesRepo.getByOrderIdAndType(orderId, InvoiceType.ACKNOWLEDGEMENT);
  if (!existing) {
    throw new AppError('INVOICE_NOT_FOUND', 'No acknowledgement draft found for this order');
  }
  if (existing.status === 'ISSUED') {
    return {
      invoiceId: existing.id,
      pdfUrl: existing.pdfUrl ?? `/api/invoices/${existing.id}/pdf`,
    };
  }

  const issuedAt = new Date();
  const updated = await deps.invoicesRepo.setIssued(existing.id, issuedAt);

  // New subscriptions on ACK are for reference/billing only; they are activated on customer profile only after Final invoice and payment (see fulfillNewSubscriptionsFromAckInvoice when payment is recorded).

  const { pdfUrl } = await generateAndStoreInvoicePdf(updated.id, {
    invoicesRepo: deps.invoicesRepo,
    ordersRepo: deps.ordersRepo,
    customersRepo: deps.customersRepo,
    brandingRepo: deps.brandingRepo,
    pdfGenerator: deps.pdfGenerator,
    storageAdapter: deps.storageAdapter,
  });

  const order = await deps.ordersRepo.getById(orderId);
  const draftHasSubscription =
    (existing.orderMode === InvoiceOrderMode.SUBSCRIPTION_ONLY || existing.orderMode === InvoiceOrderMode.BOTH) &&
    (existing.subscriptionId || (existing.subscriptionUsagesJson && Array.isArray(existing.subscriptionUsagesJson) && (existing.subscriptionUsagesJson as { subscriptionId?: string }[]).length > 0));
  const subscriptionIdsFromJson: string[] =
    Array.isArray(existing.subscriptionUsagesJson) &&
    (existing.subscriptionUsagesJson as { subscriptionId?: string }[]).every((u) => typeof u?.subscriptionId === 'string')
      ? (existing.subscriptionUsagesJson as { subscriptionId: string }[]).map((u) => u.subscriptionId)
      : [];
  const primarySubscriptionId =
    subscriptionIdsFromJson[0] ?? order?.subscriptionId ?? existing.subscriptionId ?? null;
  const shouldApplySubscription =
    (options?.applySubscription || draftHasSubscription) &&
    primarySubscriptionId &&
    deps.subscriptionsRepo &&
    deps.subscriptionUsageRepo;
  // At ACK we deduct 1 pickup + weight/items from subscription so customer/admin see updated summary. When final is issued, we replace this with the final weight/items (admin may change weight).
  const weightKgForSubscription = options?.weightKg ?? (existing.subscriptionUsageKg != null ? Number(existing.subscriptionUsageKg) : 0);
  const itemsCountForSubscription = options?.itemsCount ?? (existing.subscriptionUsageItems ?? 0);
  const weightKgForDisplay = weightKgForSubscription;
  const itemsCountForDisplay = itemsCountForSubscription;

  if (shouldApplySubscription && deps.subscriptionsRepo && deps.subscriptionUsageRepo) {
    const idsToApply = subscriptionIdsFromJson.length > 0 ? subscriptionIdsFromJson : [primarySubscriptionId!];
    for (const subscriptionId of idsToApply) {
      await applySubscriptionToOrder(
        {
          orderId,
          subscriptionId,
          invoiceId: updated.id,
          weightKg: weightKgForSubscription,
          itemsCount: itemsCountForSubscription,
        },
        {
          ordersRepo: deps.ordersRepo,
          subscriptionsRepo: deps.subscriptionsRepo,
          subscriptionUsageRepo: deps.subscriptionUsageRepo,
          subscriptionPlansRepo: deps.subscriptionPlansRepo,
        },
      );
    }
    await deps.invoicesRepo.updateSubscriptionAndPayment(updated.id, {
      subscriptionUtilized: true,
      subscriptionId: primarySubscriptionId,
      subscriptionUsageKg: weightKgForDisplay ?? null,
      subscriptionUsageItems: itemsCountForDisplay ?? null,
      paymentStatus: 'DUE',
    });
  }

  return { invoiceId: updated.id, pdfUrl };
}
