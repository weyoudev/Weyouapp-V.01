import { AppError } from '../errors';
import type { SubscriptionsRepo, SubscriptionPlansRepo, PaymentsRepo, InvoicesRepo, BrandingRepo, BranchRepo, AddressesRepo, ServiceAreaRepo } from '../ports';
import { getBrandingSnapshotForBranchId } from '../invoices/create-final-invoice-draft.use-case';
import { toIndiaDateKey, dateKeyToDdMmYyyy } from '../time/india-date';

export interface PurchaseSubscriptionParams {
  userId: string;
  planId: string;
  /** Address for this subscription (pincode determines branch). Subscription is tied to this address and cannot be changed. */
  addressId: string;
}

export interface PurchaseSubscriptionDeps {
  subscriptionsRepo: SubscriptionsRepo;
  subscriptionPlansRepo: SubscriptionPlansRepo;
  paymentsRepo: PaymentsRepo;
  invoicesRepo: InvoicesRepo;
  brandingRepo: BrandingRepo;
  branchRepo: BranchRepo;
  addressesRepo: AddressesRepo;
  serviceAreaRepo: ServiceAreaRepo;
}

export interface PurchaseSubscriptionResult {
  subscriptionId: string;
  invoiceId: string;
  planName: string;
  validityStartDate: Date;
  validTill: Date;
  remainingPickups: number;
}

/**
 * Simulated purchase: create subscription, then create payment and subscription invoice (like Final invoice).
 */
export async function purchaseSubscription(
  params: PurchaseSubscriptionParams,
  deps: PurchaseSubscriptionDeps,
): Promise<PurchaseSubscriptionResult> {
  const plan = await deps.subscriptionPlansRepo.getById(params.planId);
  if (!plan) {
    throw new AppError('PLAN_NOT_FOUND', 'Subscription plan not found', { planId: params.planId });
  }
  if (!plan.active) {
    throw new AppError('PLAN_NOT_FOUND', 'Subscription plan is not active');
  }

  const existingActiveForPlan = await deps.subscriptionsRepo.findActiveByUserIdAndPlanId(params.userId, params.planId);
  if (existingActiveForPlan) {
    throw new AppError(
      'ACTIVE_SUBSCRIPTION_SAME_PLAN',
      'You already have an active subscription for this plan. Use it until it expires or becomes inactive, or purchase a different plan.',
      { planId: params.planId, subscriptionId: existingActiveForPlan.id },
    );
  }

  const address = await deps.addressesRepo.getByIdForUser(params.addressId, params.userId);
  if (!address) {
    throw new AppError('ADDRESS_NOT_FOUND', 'Selected address not found or does not belong to you.', { addressId: params.addressId });
  }

  const serviceArea = await deps.serviceAreaRepo.getByPincode(address.pincode);
  if (!serviceArea || !serviceArea.active) {
    throw new AppError(
      'PINCODE_NOT_SERVICEABLE',
      `The selected address pincode ${address.pincode} is not serviceable. Please choose an address in our service area.`,
      { pincode: address.pincode },
    );
  }

  const branchId = serviceArea.branchId;
  const validityStartDate = new Date();
  const validTill = new Date(validityStartDate);
  validTill.setDate(validTill.getDate() + plan.validityDays);

  const sub = await deps.subscriptionsRepo.create({
    userId: params.userId,
    planId: params.planId,
    branchId,
    addressId: params.addressId,
    validityStartDate,
    expiryDate: validTill,
    remainingPickups: plan.maxPickups,
  });

  const amountPaise = plan.pricePaise ?? 0;
  // Do not create payment as CAPTURED at purchase. Invoice is created with status DUE when amount > 0;
  // admin records payment later, then invoice becomes PAID and customer sees Paid.

  // Subscription bill uses the branch that serves the subscription address (pincode)
  const branch = await deps.branchRepo.getById(branchId);
  const brandingSnapshot = await getBrandingSnapshotForBranchId(branchId, {
    branchRepo: deps.branchRepo,
    brandingRepo: deps.brandingRepo,
  });
  const brandingSnapshotJson = brandingSnapshot
    ? {
        businessName: brandingSnapshot.businessName,
        address: brandingSnapshot.address,
        phone: brandingSnapshot.phone,
        email: brandingSnapshot.email ?? null,
        footerNote: brandingSnapshot.footerNote,
        logoUrl: brandingSnapshot.logoUrl,
        upiId: brandingSnapshot.upiId,
        upiPayeeName: brandingSnapshot.upiPayeeName,
        upiQrUrl: brandingSnapshot.upiQrUrl,
        panNumber: brandingSnapshot.panNumber ?? null,
        gstNumber: brandingSnapshot.gstNumber ?? null,
        termsAndConditions: brandingSnapshot.termsAndConditions ?? null,
      }
    : undefined;

  const branch3 = branch
    ? branch.name
        .slice(0, 3)
        .toUpperCase()
        .replace(/[^A-Z]/g, 'X')
        .padEnd(3, 'X')
    : 'MAIN';
  const now = new Date();
  const dateKey = toIndiaDateKey(now);
  const ddMmYyyy = dateKeyToDdMmYyyy(dateKey);
  const count = await deps.invoicesRepo.countSubscriptionInvoicesIssuedOnDate(dateKey);
  const seq = count + 1;
  const code = `${branch3}${ddMmYyyy}${String(seq).padStart(3, '0')}SUB`;
  const subscriptionPurchaseSnapshot = {
    validTill: validTill.toISOString().slice(0, 10),
    maxPickups: plan.maxPickups,
    kgLimit: plan.kgLimit != null ? Number(plan.kgLimit) : null,
    itemsLimit: plan.itemsLimit ?? null,
  };
  const invoice = await deps.invoicesRepo.createSubscriptionInvoice({
    subscriptionId: sub.id,
    planName: plan.name,
    totalPaise: amountPaise,
    code,
    brandingSnapshotJson,
    subscriptionPurchaseSnapshot,
  });

  return {
    subscriptionId: sub.id,
    invoiceId: invoice.id,
    planName: plan.name,
    validityStartDate: sub.validityStartDate,
    validTill: sub.expiryDate,
    remainingPickups: sub.remainingPickups,
  };
}
