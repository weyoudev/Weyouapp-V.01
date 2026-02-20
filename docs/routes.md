# API Routes (Step 4D)

Global prefix: **/api**

## Auth
- `POST /api/auth/customer/otp` – request OTP
- `POST /api/auth/customer/verify` – verify OTP, get JWT
- `POST /api/auth/admin/login` – admin login

## Orders (customer)
- `POST /api/orders` – create order (CUSTOMER)
- `GET /api/orders` – list my orders (CUSTOMER)
- `GET /api/orders/:id` – get order (owner or ADMIN/OPS/BILLING)
- `GET /api/orders/:id/invoices` – list invoices for order (CUSTOMER, owner only)
- `GET /api/orders/:id/feedback/eligibility` – feedback eligibility (CUSTOMER)
- `POST /api/orders/:id/feedback` – submit order feedback (CUSTOMER)
- `PATCH /api/orders/:id/status` – update status (ADMIN, OPS)

## Invoices
- `GET /api/invoices/:invoiceId/pdf` – stream PDF (ADMIN/BILLING/OPS or CUSTOMER owner) – **501 until Step 4C**

## Admin – Orders
- `GET /api/admin/orders` – list (ADMIN, OPS, BILLING) query: status?, pincode?, serviceType?, dateFrom?, dateTo?, limit?, cursor?
- `GET /api/admin/orders/:id/summary` – full summary (ADMIN, OPS, BILLING)

## Admin – Invoices
- `POST /api/admin/orders/:id/ack-invoice/draft` – body: items, taxPaise?, discountPaise?
- `POST /api/admin/orders/:id/ack-invoice/issue`
- `POST /api/admin/orders/:id/final-invoice/draft` – body: items, taxPaise?, discountPaise?
- `POST /api/admin/orders/:id/final-invoice/issue`

## Admin – Payments
- `PATCH /api/admin/orders/:id/payment` – body: provider, status, amountPaise, note? (ADMIN, BILLING)

## Admin – Catalog (items)
- `GET /api/admin/items` – list all (ADMIN)
- `POST /api/admin/items` – body: name, active?
- `PATCH /api/admin/items/:id` – body: name?, active?
- `PUT /api/admin/items/:id/prices` – body: prices: [{ serviceType, unitPricePaise, active? }]

## Admin – Subscription plans
- `GET /api/admin/subscription-plans` – list all (ADMIN)
- `POST /api/admin/subscription-plans` – body: name, variant, validityDays, maxPickups, kgLimit?, itemsLimit?, pricePaise, active?
- `PATCH /api/admin/subscription-plans/:id` – body: name?, variant?, validityDays?, maxPickups?, kgLimit?, itemsLimit?, pricePaise?, active?

## Admin – Branding
- `GET /api/admin/branding` – get (ADMIN, BILLING)
- `PUT /api/admin/branding` – body: businessName, address, phone, footerNote?, upiId?, upiPayeeName?, upiLink?
- `POST /api/admin/branding/logo` – **501 until Step 4C**
- `POST /api/admin/branding/upi-qr` – **501 until Step 4C**

## Admin – Service areas
- `GET /api/admin/service-areas` – list (ADMIN)
- `POST /api/admin/service-areas` – body: pincode, active
- `PATCH /api/admin/service-areas/:pincode` – body: active

## Admin – Analytics
- `GET /api/admin/analytics/revenue` – query: preset? OR dateFrom&dateTo (ADMIN, BILLING)

## Admin – Customers
- `GET /api/admin/customers/search?phone=...` – (ADMIN, OPS, BILLING)
- `GET /api/admin/customers/:userId` – (ADMIN, OPS, BILLING)
- `PATCH /api/admin/customers/:userId` – body: name?, email?, notes? (ADMIN)

## Admin – Users
- `GET /api/admin/users` – list admin/billing/ops users (ADMIN), query: role?, active?, search?, limit?, cursor? → { data, nextCursor }
- `POST /api/admin/users` – body: name?, email, role, isActive? (ADMIN) → { user, tempPassword } (password is shown only once)
- `PATCH /api/admin/users/:id` – body: name?, role?, isActive? (ADMIN)

## Admin – Feedback
- `GET /api/admin/feedback` – query: type?, status?, rating?, dateFrom?, dateTo?, limit?, cursor? (ADMIN, OPS) → { data, nextCursor }
- `PATCH /api/admin/feedback/:id` – body: status, adminNotes? (ADMIN, OPS)

## Customer / Public
- `GET /api/serviceability?pincode=XXXXX` – public, no auth → { pincode, serviceable, message }
- `GET /api/items?serviceType=WASH_FOLD|WASH_IRON|DRY_CLEAN` – (CUSTOMER)
- `GET /api/subscription-plans` – active only (CUSTOMER)
- `POST /api/feedback` – general feedback body: rating?, tags?, message? (CUSTOMER)
- `GET /api/feedback` – list my feedback (CUSTOMER)

## Assets (public)
- `GET /api/assets/branding/:fileName` – **501 until Step 4C**

---

## Manual test hints (Postman)

1. **Auth**  
   - Get customer JWT: `POST /api/auth/customer/verify` with body `{ "phone": "9876543210", "otp": "123456" }` (or your seeded OTP).  
   - Get admin JWT: `POST /api/auth/admin/login` with credentials.  
   - Use header: `Authorization: Bearer <token>`.

2. **Paginated lists**  
   - Admin orders: `GET /api/admin/orders?limit=20&cursor=<nextCursor>`  
   - Admin feedback: `GET /api/admin/feedback?limit=20`  
   - Responses: `{ "data": [...], "nextCursor": "<string | null>" }`.

3. **Errors**  
   - All application errors: `{ "error": { "code": "...", "message": "...", "details?": {} } }`  
   - 501 placeholders (PDF, logo, UPI QR, assets): body may include `error: { code: "NOT_IMPLEMENTED", message: "..." }`.

4. **Enums**  
   - serviceType: `WASH_FOLD` | `WASH_IRON` | `DRY_CLEAN`  
   - OrderStatus: e.g. `BOOKING_CONFIRMED`, `PICKED_UP`, `DELIVERED`  
   - InvoiceItemType: `SERVICE` | `DRYCLEAN_ITEM` | `ADDON` | `FEE` | `DISCOUNT`  
   - PaymentProvider: `RAZORPAY` | `CASH` | `UPI` | `NONE`  
   - PaymentStatus: `PENDING` | `CAPTURED` | `FAILED`  
   - FeedbackType: `ORDER` | `GENERAL`  
   - FeedbackStatus: `NEW` | `REVIEWED` | `RESOLVED`  
   - SubscriptionVariant: `SINGLE` | `COUPLE` | `FAMILY`

5. **Dates**  
   - dateFrom/dateTo: `YYYY-MM-DD`  
   - Pincode: 6 digits (India).
