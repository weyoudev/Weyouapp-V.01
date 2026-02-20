# Audit Report & Optimization Plan

**Scope:** Laundry SaaS monorepo — code optimization (unused removal) + Supabase data structure.  
**Rules:** No behavior change; no deletion without proof of unused; build after each batch.

---

## Build scripts (reference)

| Command | Purpose |
|--------|---------|
| `npm run build:api` | API: `tsc -p apps/api/tsconfig.build.json` |
| `npm run build -w admin-web` | Admin web: `next build` (from admin-web) |
| `npm run build -w customer-web` | Customer web: `next build` (from customer-web) |
| `npm run prisma:generate` | Generate Prisma client (schema: `apps/api/src/infra/prisma/schema.prisma`) |
| `npm run prisma:seed` | Full seed: `scripts/seed.ts` (demo + transactional data) |
| `npm run purge:db` | Purge transactional data (keeps admin users + master) |

*Note: Root has no `build:web`; use `npm run build -w admin-web` (and `-w customer-web`) for frontends.*

---

## 1) Unused code candidates report

### 1.1 Backend (API) — CONFIRMED UNUSED

| File | Evidence |
|------|----------|
| `apps/api/src/application/catalog/list-prices-for-service.use-case.ts` | **No imports.** `listCatalogForService` (used by ItemsService) uses `laundryItemPricesRepo.listActiveForService()` directly; nothing imports `listPricesForService`. |

**No other application use-cases or ports were found unused.** All other use-cases are imported by at least one of: API services, controllers, other use-cases, or tests.

### 1.2 Backend — NOT unused (verified in use)

- `subscription-deduct-assert.use-case.ts` — used by `apply-subscription-to-order.use-case.ts` and `subscription-limits.spec.ts`
- `calculate-invoice-totals.ts` — used by create-ack-invoice-draft, create-final-invoice-draft, invoices.service, invoice-totals.spec
- `time-window.ts` — used by create-order.use-case
- `slot-helper.ts` — used by create-order.use-case
- All ports in `application/ports/index.ts` are bound in `infra.module.ts` and used by services/use-cases

### 1.3 Admin-web

- **No clearly unused source files identified.** All components under `components/` that were checked are imported by at least one page or another component (e.g. AddressAutocomplete, RoleGate, EmptyState, ErrorDisplay, StatusBadge, BranchFilter, CatalogCard, InvoiceBuilder, etc.).
- **Hooks:** useOrders, useCatalog, useBranding, useInvoice, useFeedback, useCustomers, useAnalytics, useBranches, useServiceAreas, useSubscriptionPlans, usePayments, useOrderStatus, useOrderSummary, useSystemStatus, useDebounce — all referenced from app pages or layout.
- **Lib:** api, auth, format, india-date, time-slots, subscription-preview, admin-users-api, query-client — all imported.
- **Types:** types/index and specific type files are imported from components/hooks.

*Recommendation:* Do not delete any admin-web file without a second pass (e.g. script that lists files and counts import references).

### 1.4 Shared package (`packages/shared`)

- `packages/shared/src/enums.ts` — used by API and admin-web via `@shared/enums`. **Keep.**

### 1.5 Summary — safe to delete (after build verification)

| Batch | Item | Action |
|-------|------|--------|
| Backend batch 1 | `apps/api/src/application/catalog/list-prices-for-service.use-case.ts` | Delete only after: (1) confirming no dynamic import, (2) running `npm run build:api` and (3) running tests. |

---

## 2) Optimization plan (deletion batches)

- **Batch 1 (API):** Remove `list-prices-for-service.use-case.ts`.  
  - Before: Run `npm run build:api`.  
  - After: Run `npm run build:api` again; run `npm run test` if available.  
- **Batch 2 (admin-web):** No deletions recommended from this audit. If later you add an automated “unused file” check (e.g. by import count), run `npm run build -w admin-web` after any removal.  
- **Batch 3 (shared):** No changes.

---

## 3) Supabase data organization plan

### 3.1 Master data vs transactional data

| Layer | Tables / data | Seeded by bootstrap? | Notes |
|-------|----------------|----------------------|--------|
| **Identity / auth** | User (admin: ADMIN/OPS/BILLING, isActive) | Yes — default admin user(s) | Keep for login; no transactional sample users |
| **Customer profile** | User (CUSTOMER), Address | No (empty or real only) | Purge script removes customer data; bootstrap does not create customers |
| **Master** | SegmentCategory, ServiceCategory, BrandingSettings, OperatingHours, Holiday, SlotConfig, Branch, ServiceArea, LaundryItem, LaundryItemPrice, LaundryItemBranch, ItemSegmentServicePrice, ServicePriceConfig, DryCleanItem, SubscriptionPlan, SubscriptionPlanBranch | Yes — minimal defaults | SegmentCategory + ServiceCategory base rows; one BrandingSettings; OperatingHours default; ServiceArea optional/empty; no sample branches/items/plans unless minimal placeholder |
| **Transactional** | Order, OrderItem, Invoice, InvoiceItem, Payment, Feedback, SubscriptionUsage, Subscription | No | Empty after bootstrap; purge script clears these (and customer Address/User) |

### 3.2 What gets seeded (bootstrap) vs full seed

- **Bootstrap (new script `apps/api/scripts/bootstrap-master-data.ts`):**
  - Default admin user (if none exists).
  - SegmentCategory base (e.g. MEN, WOMEN, KIDS, HOME_LINEN).
  - ServiceCategory base (e.g. WASH_FOLD, WASH_IRON, STEAM_IRON, DRY_CLEAN).
  - BrandingSettings minimal default (single row).
  - OperatingHours default (e.g. one row or per-branch placeholder).
  - ServiceArea: optional / empty (or one pincode if app requires it).
  - No customers, orders, invoices, payments, feedback, subscriptions.
- **Full seed (`scripts/seed.ts`):** Stays as-is for demo; creates customers, orders, invoices, etc. Use only for dev/demo; production uses bootstrap only.

### 3.3 Indexes and constraints (add via migration; non-breaking)

| Target | Change | Notes |
|--------|--------|--------|
| **Order** | Add `@@index([userId, status])` | Admin/customer order lists by user + status (schema uses `userId`, not `customerId`) |
| **Address** | Add `@@index([userId])` | Lookups by user |
| **Subscription** | Add `@@index([userId, active])` or `@@index([userId, active, expiryDate])` | Active subscriptions per user |
| **Invoice** | Optional: unique on `code` | Schema has `Invoice.code` (String?). Unique on `code` requires non-null; if some rows have null `code`, add a partial unique index in raw SQL (Prisma schema does not support partial indexes). Prefer backfilling `code` and then adding `@@unique([code])` or a partial unique index. |
| **ItemSegmentServicePrice** | Already has `@@unique([itemId, segmentCategoryId, serviceCategoryId])` | No change |

**Naming note:** “invoiceNumber” in requirements = `Invoice.code` in schema. “customerId” = `Order.userId` / `Subscription.userId`; “validTill” = `Subscription.expiryDate`.

---

## 4) Bootstrap script deliverable

- **Path:** `apps/api/scripts/bootstrap-master-data.ts` (or `scripts/bootstrap-master-data.ts` at root if you prefer same as seed).
- **Behavior:**
  - Idempotent.
  - Ensure one default admin user (if none).
  - Insert base SegmentCategory and ServiceCategory rows (by code).
  - Upsert single BrandingSettings default.
  - Upsert default OperatingHours (e.g. one global or per-branch).
  - Optionally create one Branch + one ServiceArea if app needs it for boot.
  - No Orders, Invoices, Payments, Feedback, Subscriptions, or customer Users/Addresses.
- **Run:** e.g. `npx ts-node --transpile-only --project scripts/tsconfig.seed.json apps/api/scripts/bootstrap-master-data.ts` (or from root with same tsconfig as seed), after migrations and with correct `DATABASE_URL`.

---

## 5) Process summary

| Step | Action | Output |
|------|--------|--------|
| **Step 1** | Generate audit report (no deletions) | This document (Audit + Plan). |
| **Step 2** | Add missing indexes/constraints via Prisma migration | New migration; deploy with `prisma:migrate`. |
| **Step 3** | Add bootstrap script for master data only | `bootstrap-master-data.ts`; run on new DB after migrate. |
| **Step 4** | Safe deletion batches | Batch 1: delete `list-prices-for-service.use-case.ts`; run `npm run build:api` (and tests) after. Frontend: no deletions in this audit. |

---

## 6) Expected build commands after each batch

- After API change:  
  `npm run build:api`
- After admin-web change:  
  `npm run build -w admin-web`
- After customer-web change:  
  `npm run build -w customer-web`

All flows (admin login, customer OTP, create order, catalog pricing, ACK/FINAL invoice, subscription deduction, PDFs, analytics, feedback) remain unchanged; only unused code removal and additive DB/index changes are applied.
