# Subscription lifecycle rules – plan and file list

**Goal:** Make subscription inactivation rules explicit and enforced end-to-end when issuing ACK invoice. Inactive subscriptions must not be selectable for new bookings.

---

## 1) Files to modify

### Backend (API)

| File | Purpose |
|------|--------|
| `apps/api/src/application/errors.ts` | Add error codes: `SUBSCRIPTION_INACTIVE`, `SUBSCRIPTION_LIMIT_REACHED` (keep `SUBSCRIPTION_EXPIRED`, `NO_REMAINING_PICKUPS`). |
| `apps/api/src/application/time/india-now.ts` | **New.** Export `getIndiaNow(): Date` (Asia/Kolkata) for validity/“today” checks. |
| `apps/api/src/application/subscriptions/subscription-deduct-assert.use-case.ts` | Use India “now” for expiry; use `getEffectiveLimits` in `isSubscriptionExhausted`; optional: throw `SUBSCRIPTION_INACTIVE` / `SUBSCRIPTION_LIMIT_REACHED` where appropriate. |
| `apps/api/src/application/orders/apply-subscription-to-order.use-case.ts` | Before deduct: assert with `assertSubscriptionDeductionAllowed` (plan from repo); after `updateUsage`, recompute remaining (pickups/kg/items) and call `isSubscriptionExhausted(updated, plan)` using **subscription’s** total* limits via `getEffectiveLimits`; if exhausted, call `setInactive`; use India now for expiry in assert. |
| `apps/api/src/application/invoices/issue-ack-invoice-use-case.ts` | When `existing.status !== 'DRAFT'`: **return immediately** with `invoiceId`/`pdfUrl` and **do not** run `applySubscriptionToOrder` (idempotency: already issued). Only run deduction when issuing from DRAFT. |
| `apps/api/src/infra/prisma/repos/prisma-subscriptions-repo.ts` | `listActiveByUserId`: filter using India “now” for `expiryDate`; treat “active” as `active === true && now <= expiryDate && remainingPickups > 0 && (totalKgLimit == null \|\| usedKg < totalKgLimit) && (totalItemsLimit == null \|\| usedItemsCount < totalItemsLimit)`. `findActiveByUserId`: return first from `listActiveByUserId` (or same filters) so legacy callers get only truly active. `findActiveByUserIdAndPlanId`: add same expiry + remaining checks (already has expiry/remainingPickups; add kg/items). |
| `apps/api/src/application/ports/subscriptions-repo.port.ts` | No signature change; optional: document that “active” means all conditions (isActive, now <= validTill, remainingPickups > 0, remainingKg/remainingItems when limits exist). |
| `apps/api/src/api/admin/services/admin-invoices.service.ts` | If ACK issue response is extended with “subscriptionsUpdated” or “inactivatedSubscriptionIds”, pass through from use-case (optional). |
| New/updated tests | See Test plan below. |

### Admin Web

| File | Purpose |
|------|--------|
| `apps/admin-web/lib/subscription-preview.ts` | Add `willBecomeInactiveAfterAck(preview, validTill: Date): boolean` (true if any of: previewRemainingPickups <= 0, previewRemainingKg <= 0, previewRemainingItems <= 0, or `now > validTill`). Reuse existing preview types; validTill from subscription. |
| `apps/admin-web/app/(protected)/orders/[id]/page.tsx` | In ACK subscription section: show “After this ACK” preview (existing). Add warning: “Subscription will become inactive after issuing this ACK” when `willBecomeInactiveAfterAck(...)`. After successful “Issue ACK”: invalidate customer/subscription queries so Customer profile panel and subscription list refresh (subscription shows INACTIVE). |

### Customer Simulator

| File | Purpose |
|------|--------|
| `apps/admin-web/app/(protected)/customer-simulator/page.tsx` | Subscription list already comes from `me.activeSubscriptions` (backend). Ensure after ACK issue (or any action that may deactivate a subscription) refetch `/me` so active list excludes newly inactive subscriptions. If simulator uses a shared “me” query key, invalidate it after creating order / or when opening “Create order” so only ACTIVE subscriptions are shown. No backend change needed if `/me` and `listActiveByUserId` already exclude inactive. |

---

## 2) Exact logic changes (pseudo)

### Backend

- **India now**
  - `getIndiaNow(): Date` – current time in Asia/Kolkata (e.g. via `Intl` or `date-fns-tz` / toZonedTime). Use everywhere we need “today” or “now” for validity.

- **Active definition (single place: repo + assert)**
  - Subscription is **ACTIVE** iff:  
    `isActive === true`  
    AND `getIndiaNow() <= expiryDate`  
    AND `remainingPickups > 0`  
    AND `(totalKgLimit == null || usedKg < totalKgLimit)`  
    AND `(totalItemsLimit == null || usedItemsCount < totalItemsLimit)`.

- **ACK issue (idempotency)**
  - If `existing.status !== 'DRAFT'`: return `{ invoiceId, pdfUrl }` and **exit**; do not call `applySubscriptionToOrder`.

- **applySubscriptionToOrder**
  - If `existingUsage` exists: return `{ applied: false }`.
  - Resolve plan (from `subscriptionPlansRepo`); call `assertSubscriptionDeductionAllowed(sub, plan, { deductedPickups: 1, deductedKg, deductedItemsCount })` (uses India now inside assert for expiry).
  - Create SubscriptionUsage; call `updateUsage(subscriptionId, { remainingPickups: sub.remainingPickups - 1, usedKg: sub.usedKg + weightKg, usedItemsCount: sub.usedItemsCount + itemsCount })`.
  - Fetch updated subscription; compute effective limits with `getEffectiveLimits(updated, plan)`; set:
    - `remainingPickups` = updated.remainingPickups (already set)
    - `remainingKg` = kgLimit != null ? kgLimit - updated.usedKg : N/A
    - `remainingItems` = itemsLimit != null ? itemsLimit - updated.usedItemsCount : N/A
  - If `remainingPickups <= 0` OR `(kgLimit != null && remainingKg <= 0)` OR `(itemsLimit != null && remainingItems <= 0)` OR `getIndiaNow() > updated.expiryDate`: call `setInactive(subscriptionId)`.

- **subscription-deduct-assert**
  - In `assertSubscriptionDeductionAllowed`: use `getIndiaNow()` instead of `new Date()` for `expiryDate` check.
  - In `isSubscriptionExhausted`: use India now for expiry; use `<= 0` for remaining (pickups/kg/items) so “equals limit” is exhausted.
  - Optionally throw `SUBSCRIPTION_INACTIVE` when `!sub.active`, `SUBSCRIPTION_EXPIRED` when expired, `SUBSCRIPTION_LIMIT_REACHED` when kg/items limit hit, `NO_REMAINING_PICKUPS` when pickups.

- **prisma-subscriptions-repo**
  - `listActiveByUserId`: use `getIndiaNow()` for `expiryDate` filter; exclude rows where `remainingPickups <= 0` or (totalKgLimit != null && usedKg >= totalKgLimit) or (totalItemsLimit != null && usedItemsCount >= totalItemsLimit). Keep `active === true`.
  - `findActiveByUserId`: use same criteria (e.g. call `listActiveByUserId` and return first, or duplicate where clause).
  - `findActiveByUserIdAndPlanId`: add kg/items limit check; use India now for expiry.

### Admin UI

- **subscription-preview**
  - `willBecomeInactiveAfterAck(result: SubscriptionPreviewResult, validTill: Date): boolean`  
    return (result.previewRemainingPickups <= 0) \|\| (result.previewRemainingKg != null && result.previewRemainingKg <= 0) \|\| (result.previewRemainingItems != null && result.previewRemainingItems <= 0) \|\| (getIndiaNow() > validTill).  
  - Use a small India-now helper in frontend (or pass validTill as end-of-day and compare with current time in same TZ).

- **orders/[id]/page**
  - When showing ACK summary: if `willBecomeInactiveAfterAck(ackSubscriptionPreview, new Date(summary.subscription.validTill))`, show warning: “Subscription will become inactive after issuing this ACK.”
  - After “Issue ACK” success: invalidate queries for current order, customer profile, and subscriptions (e.g. `queryClient.invalidateQueries(['customer', ...])` / order summary) so Customer profile and subscription list refresh.

### Customer Simulator

- **customer-simulator/page**
  - `activeSubscriptions` from `me`; backend already excludes inactive. After “Create order” (or when switching to order form), ensure `me` is refetched or invalidate `me` so the list of selectable subscriptions is up to date. If “Create order” is in same page, invalidate `me` after order creation so next time user opens subscription list they see only active.

---

## 3) API response changes

- **GET /api/me**  
  No schema change. `activeSubscriptions` already returns only what `listActiveByUserId` returns; after repo fix it will exclude inactive/expired/limit-reached.

- **POST .../ack-invoice/issue**  
  Optional: extend response with e.g. `{ invoiceId, pdfUrl, inactivatedSubscriptionIds?: string[] }` so admin UI can show “Subscription X is now inactive.” If not added, UI can still refresh and show updated state from GET order summary / GET customer.

- **GET /api/admin/orders/:id/summary**  
  Already returns subscription with `active`; no change needed if backend sets `isActive = false` after ACK.

---

## 4) Test plan and test cases

- **subscription-deduct-assert**
  - Case: `isSubscriptionExhausted` returns true when `remainingPickups <= 0` (not only < 0).
  - Case: returns true when kg limit exists and usedKg >= kgLimit (remainingKg <= 0).
  - Case: returns true when items limit exists and usedItemsCount >= itemsLimit.
  - Case: returns true when `getIndiaNow() > expiryDate` (mock India now or expiryDate).

- **apply-subscription-to-order**
  - Case: after deduct, remainingPickups becomes 0 → `setInactive` called (mock or spy).
  - Case: after deduct, remainingKg becomes 0 (when plan has kg limit) → `setInactive` called.
  - Case: after deduct, remainingItems becomes 0 (when plan has items limit) → `setInactive` called.
  - Case: validTill is in the past at ACK time → `assertSubscriptionDeductionAllowed` throws SUBSCRIPTION_EXPIRED (or SUBSCRIPTION_INACTIVE); no deduction.
  - Case: idempotency – second call for same orderId + subscriptionId returns `{ applied: false }` and does not deduct again (existing subscription-double-deduction.spec).

- **issue-ack-invoice**
  - Case: when ACK already ISSUED, calling issue again does not call `applySubscriptionToOrder` and returns existing pdfUrl.

- **prisma-subscriptions-repo (integration or e2e)**
  - Case: subscription with active=true but expiryDate in past is not in `listActiveByUserId` result.
  - Case: subscription with remainingPickups === 0 is not in list.

---

## 5) Manual verification checklist

- [ ] ACK issue: apply subscription with 1 pickup left → after issue, subscription shows inactive in DB and in Customer profile.
- [ ] ACK issue: apply subscription so kg used reaches total kg limit → subscription becomes inactive.
- [ ] ACK issue: subscription already expired (validTill < now India) → error when trying to apply; no deduction.
- [ ] ACK issue twice on same order (already issued) → second call returns success with pdfUrl, no double deduction (check SubscriptionUsage count and subscription remainingPickups).
- [ ] Customer Simulator: create order with subscription, issue ACK so subscription becomes inactive; refetch / reopen create order → that subscription no longer in “Active subscriptions” list.
- [ ] Admin order detail: ACK section shows “Subscription will become inactive after issuing this ACK” when preview remaining is 0 or validity expired; after issue, customer profile shows subscription as inactive.

---

## 6) Notes

- **Schema:** Subscription uses `expiryDate` (not `validTill`). API/UI can expose it as `validTill`; no DB rename required.
- **Mutually exclusive kg/items:** Admin input is either weightKg or itemsCount per requirement; existing draft already supports both; ensure only one is applied per subscription when both are not allowed.
- **Asia/Kolkata:** Use a single helper (e.g. `getIndiaNow()`) in backend for all “now” and “today” checks affecting validity and active list.
