import { Inject, Injectable } from '@nestjs/common';
import { purchaseSubscription } from '../../application/subscriptions/purchase-subscription.use-case';
import { listAvailablePlansForCustomer } from '../../application/subscription-plans/list-available-plans-for-customer.use-case';
import { generateAndStoreInvoicePdf } from '../../application/invoices/generate-and-store-invoice-pdf.use-case';
import type {
  SubscriptionsRepo,
  SubscriptionPlansRepo,
  PaymentsRepo,
  InvoicesRepo,
  BrandingRepo,
  BranchRepo,
  OrdersRepo,
  CustomersRepo,
  PdfGenerator,
  StorageAdapter,
  AddressesRepo,
  ServiceAreaRepo,
} from '../../application/ports';
import { InvoiceType } from '@shared/enums';
import {
  SUBSCRIPTIONS_REPO,
  SUBSCRIPTION_PLANS_REPO,
  PAYMENTS_REPO,
  INVOICES_REPO,
  BRANDING_REPO,
  BRANCH_REPO,
  ORDERS_REPO,
  CUSTOMERS_REPO,
  PDF_GENERATOR,
  STORAGE_ADAPTER,
  ADDRESSES_REPO,
  SERVICE_AREA_REPO,
} from '../../infra/infra.module';

@Injectable()
export class SubscriptionsService {
  constructor(
    @Inject(SUBSCRIPTIONS_REPO) private readonly subscriptionsRepo: SubscriptionsRepo,
    @Inject(SUBSCRIPTION_PLANS_REPO) private readonly subscriptionPlansRepo: SubscriptionPlansRepo,
    @Inject(PAYMENTS_REPO) private readonly paymentsRepo: PaymentsRepo,
    @Inject(INVOICES_REPO) private readonly invoicesRepo: InvoicesRepo,
    @Inject(BRANDING_REPO) private readonly brandingRepo: BrandingRepo,
    @Inject(BRANCH_REPO) private readonly branchRepo: BranchRepo,
    @Inject(ORDERS_REPO) private readonly ordersRepo: OrdersRepo,
    @Inject(CUSTOMERS_REPO) private readonly customersRepo: CustomersRepo,
    @Inject(PDF_GENERATOR) private readonly pdfGenerator: PdfGenerator,
    @Inject(STORAGE_ADAPTER) private readonly storageAdapter: StorageAdapter,
    @Inject(ADDRESSES_REPO) private readonly addressesRepo: AddressesRepo,
    @Inject(SERVICE_AREA_REPO) private readonly serviceAreaRepo: ServiceAreaRepo,
  ) {}

  async purchase(userId: string, planId: string, addressId: string) {
    const result = await purchaseSubscription(
      { userId, planId, addressId },
      {
        subscriptionsRepo: this.subscriptionsRepo,
        subscriptionPlansRepo: this.subscriptionPlansRepo,
        paymentsRepo: this.paymentsRepo,
        invoicesRepo: this.invoicesRepo,
        brandingRepo: this.brandingRepo,
        branchRepo: this.branchRepo,
        addressesRepo: this.addressesRepo,
        serviceAreaRepo: this.serviceAreaRepo,
      },
    );
    try {
      await generateAndStoreInvoicePdf(result.invoiceId, {
        invoicesRepo: this.invoicesRepo,
        ordersRepo: this.ordersRepo,
        customersRepo: this.customersRepo,
        brandingRepo: this.brandingRepo,
        branchRepo: this.branchRepo,
        subscriptionsRepo: this.subscriptionsRepo,
        pdfGenerator: this.pdfGenerator,
        storageAdapter: this.storageAdapter,
      });
    } catch {
      // Non-fatal: invoice exists, PDF can be regenerated later from admin
    }
    return result;
  }

  /** Subscription detail for customer: summary + payment status + invoice preview. */
  async getSubscriptionDetailForCustomer(userId: string, subscriptionId: string) {
    const subscription = await this.subscriptionsRepo.getById(subscriptionId);
    if (!subscription || subscription.userId !== userId) return null;
    const plan = await this.subscriptionPlansRepo.getById(subscription.planId);
    const invoice = await this.invoicesRepo.getBySubscriptionIdAndType(subscriptionId, InvoiceType.SUBSCRIPTION);
    const payment = await this.paymentsRepo.getBySubscriptionId(subscriptionId);
    const paymentStatus = invoice?.paymentStatus ?? (payment?.status === 'CAPTURED' ? 'PAID' : 'DUE');
    return {
      id: subscription.id,
      planId: subscription.planId,
      planName: plan?.name ?? null,
      planDescription: plan?.description ?? null,
      active: subscription.active,
      validityStartDate: subscription.validityStartDate.toISOString(),
      validTill: subscription.expiryDate.toISOString(),
      remainingPickups: subscription.remainingPickups,
      remainingKg: subscription.totalKgLimit != null ? Math.max(0, Number(subscription.totalKgLimit) - Number(subscription.usedKg)) : null,
      remainingItems: subscription.totalItemsLimit != null ? Math.max(0, (subscription.totalItemsLimit ?? 0) - subscription.usedItemsCount) : null,
      maxPickups: subscription.totalMaxPickups ?? plan?.maxPickups ?? 0,
      kgLimit: subscription.totalKgLimit ?? plan?.kgLimit ?? null,
      itemsLimit: subscription.totalItemsLimit ?? plan?.itemsLimit ?? null,
      usedKg: Number(subscription.usedKg),
      usedItemsCount: subscription.usedItemsCount,
      addressId: subscription.addressId ?? null,
      paymentStatus: paymentStatus === 'PAID' ? 'PAID' : 'DUE',
      invoice: invoice
        ? { id: invoice.id, code: invoice.code, pdfUrl: invoice.pdfUrl, issuedAt: invoice.issuedAt }
        : null,
    };
  }

  /** Returns subscription invoice for customer's own subscription (for profile / invoice access). */
  async getSubscriptionInvoiceForCustomer(userId: string, subscriptionId: string) {
    const subscription = await this.subscriptionsRepo.getById(subscriptionId);
    if (!subscription || subscription.userId !== userId) {
      return null;
    }
    const invoice = await this.invoicesRepo.getBySubscriptionIdAndType(subscriptionId, InvoiceType.SUBSCRIPTION);
    if (!invoice) return null;
    return {
      id: invoice.id,
      subscriptionId: invoice.subscriptionId,
      type: invoice.type,
      status: invoice.status,
      code: invoice.code,
      subtotal: invoice.subtotal,
      tax: invoice.tax,
      total: invoice.total,
      discountPaise: invoice.discountPaise,
      issuedAt: invoice.issuedAt,
      pdfUrl: invoice.pdfUrl,
      paymentStatus: invoice.paymentStatus,
      items: invoice.items ?? [],
      subscriptionPurchaseSnapshotJson: (invoice as { subscriptionPurchaseSnapshotJson?: unknown }).subscriptionPurchaseSnapshotJson,
    };
  }

  async getAvailablePlans(userId: string) {
    return listAvailablePlansForCustomer(userId, {
      subscriptionPlansRepo: this.subscriptionPlansRepo,
      subscriptionsRepo: this.subscriptionsRepo,
    });
  }
}
