# Data structure options (architectural freedom)

After clearing all data with `reset:all`, you can change the schema for clarity and then re-run migrations (or add new ones). This doc outlines **optional** improvements you can make without breaking existing flows if applied carefully.

---

## 1. Clear all data and start fresh

```bash
# Wipes every row in every app table (keeps schema + prisma_migrations)
RESET_ALL_CONFIRM=YES npm run reset:all
```

Then load fresh data:

- **Full demo:** `npm run prisma:seed`
- **Minimal (when added):** `npm run bootstrap` — admin + categories + branding only

---

## 2. Naming consistency (optional)

| Current | Alternative | Notes |
|--------|-------------|--------|
| `User` (role CUSTOMER/ADMIN/…) | Keep as-is, or introduce `Customer` view | Single User table is simple; splitting would need a big migration. |
| `Order.userId` | Could add `customerId` as alias in app layer | Schema: still `userId`; in code you can map to "customer" where it’s a CUSTOMER order. |
| `Invoice.code` | Consider `invoiceNumber` in code/docs | DB column can stay `code`; use a getter or DTO field `invoiceNumber`. |
| `Subscription.expiryDate` | Could add `validTill` in API response | Same as above: keep column, expose friendlier name in API. |

**Recommendation:** Prefer clarity in **API and code** (DTOs, variable names) before renaming columns. Column renames need a migration and updating all Prisma usage.

---

## 3. Logical grouping (without moving tables)

You can make the **mental model** clearer without changing the DB:

- **Identity:** User (login, role, isActive)
- **Profile:** User (name, phone, email), Address
- **Master:** Branch, ServiceArea, SlotConfig, Holiday, OperatingHours, LaundryItem, ServiceCategory, SegmentCategory, ItemSegmentServicePrice, LaundryItemPrice, SubscriptionPlan, BrandingSettings, ServicePriceConfig, DryCleanItem
- **Transactional:** Order, OrderItem, Invoice, InvoiceItem, Payment, Subscription, SubscriptionUsage, Feedback

If you ever want **Postgres schemas** (e.g. `master.*`, `tx.*`), that would be a larger change: new migration creating schemas and moving tables, plus Prisma schema updates.

---

## 4. Safe schema changes (migrations)

When you’re ready to change the **schema** for clarity:

1. **Add only (non-breaking):**
   - New optional columns
   - New indexes
   - New tables with FKs to existing ones

2. **Rename / restructure (breaking):**
   - Add a new column (e.g. `invoice_number`), backfill, switch code, then drop old column in a later migration.
   - Or: create a new table, migrate data, point app to new table, drop old (bigger change).

3. **Create migration:**
   ```bash
   npx prisma migrate dev --schema=apps/api/src/infra/prisma/schema.prisma --name your_descriptive_name
   ```
   Edit the generated SQL if you need raw SQL (e.g. partial unique index on `Invoice.code` where not null).

---

## 5. Suggested order of work

1. Run **reset:all** and then **seed** (or bootstrap) so you have a clean, predictable dataset.
2. Adjust **code and API** naming (DTOs, response fields) for clarity; no DB change.
3. Add **indexes** you need (see `AUDIT-AND-OPTIMIZATION-PLAN.md`) via a new migration.
4. If you still want **column renames or new tables**, add migrations step by step and run tests after each.

This keeps the DB understandable while giving you room to evolve the architecture safely.
