import { InvoiceType } from '@shared/enums';
import { AppError } from '../errors';
import { assertCanIssueFinalInvoice } from './issue-final-invoice.use-case';
import { generateAndStoreInvoicePdf } from './generate-and-store-invoice-pdf.use-case';
import type { OrdersRepo, InvoicesRepo, CustomersRepo, BrandingRepo, PdfGenerator, StorageAdapter, SubscriptionsRepo, SubscriptionUsageRepo } from '../ports';

export interface IssueFinalInvoiceDeps {
  ordersRepo: OrdersRepo;
  invoicesRepo: InvoicesRepo;
  customersRepo: CustomersRepo;
  brandingRepo: BrandingRepo;
  pdfGenerator: PdfGenerator;
  storageAdapter: StorageAdapter;
  subscriptionsRepo?: SubscriptionsRepo;
  subscriptionUsageRepo?: SubscriptionUsageRepo;
}

/**
 * Issues the final invoice: sets ISSUED, generates and stores PDF, sets pdfUrl.
 * Allowed when order status is OUT_FOR_DELIVERY or DELIVERED.
 */
export async function issueFinalInvoice(
  orderId: string,
  deps: IssueFinalInvoiceDeps,
): Promise<{ invoiceId: string; pdfUrl: string }> {
  await assertCanIssueFinalInvoice(orderId, { ordersRepo: deps.ordersRepo });

  const existing = await deps.invoicesRepo.getByOrderIdAndType(orderId, InvoiceType.FINAL);
  if (!existing) {
    throw new AppError('INVOICE_NOT_FOUND', 'No final draft found for this order');
  }
  if (existing.status !== 'DRAFT') {
    return {
      invoiceId: existing.id,
      pdfUrl: existing.pdfUrl ?? `/api/invoices/${existing.id}/pdf`,
    };
  }

  const issuedAt = new Date();
  const updated = await deps.invoicesRepo.setIssued(existing.id, issuedAt);
  const { pdfUrl } = await generateAndStoreInvoicePdf(updated.id, {
    invoicesRepo: deps.invoicesRepo,
    ordersRepo: deps.ordersRepo,
    customersRepo: deps.customersRepo,
    brandingRepo: deps.brandingRepo,
    pdfGenerator: deps.pdfGenerator,
    storageAdapter: deps.storageAdapter,
  });
  if (updated.total === 0) {
    await deps.ordersRepo.updatePaymentStatus(orderId, 'CAPTURED');
    await deps.invoicesRepo.updateSubscriptionAndPayment(updated.id, { paymentStatus: 'PAID' });
  }

  // Replace ACK deduction with final weight/items: subtract what was deducted at ACK, then add final amounts.
  if (deps.subscriptionsRepo && deps.subscriptionUsageRepo) {
    const order = await deps.ordersRepo.getById(orderId);
    const subscriptionId = order?.subscriptionId ?? null;
    const finalKg = updated.subscriptionUsageKg != null ? Number(updated.subscriptionUsageKg) : 0;
    const finalItems = updated.subscriptionUsageItems ?? 0;
    if (subscriptionId) {
      const usage = await deps.subscriptionUsageRepo.findByOrderIdAndSubscriptionId(orderId, subscriptionId);
      if (usage) {
        const sub = await deps.subscriptionsRepo.getById(subscriptionId);
        if (sub) {
          const ackKg = usage.deductedKg ?? 0;
          const ackItems = usage.deductedItemsCount ?? 0;
          const newUsedKg = Number(sub.usedKg) - ackKg + finalKg;
          const newUsedItemsCount = sub.usedItemsCount - ackItems + finalItems;
          await deps.subscriptionUsageRepo.updateDeductedAmounts(orderId, subscriptionId, finalKg, finalItems);
          await deps.subscriptionsRepo.updateUsage(subscriptionId, {
            remainingPickups: sub.remainingPickups,
            usedKg: newUsedKg,
            usedItemsCount: newUsedItemsCount,
          });
        }
      }
    }
  }

  return { invoiceId: updated.id, pdfUrl };
}
