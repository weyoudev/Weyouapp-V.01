# UI testing guide — Admin + Customer flows

This doc describes how to run and test the product end-to-end using the Admin Web and Customer Web Lite UIs.

## Start services (run from repo root)

**1. Database and Prisma (once or after schema changes)**

```bash
npm run prisma:generate
npx prisma migrate deploy --schema=apps/api/src/infra/prisma/schema.prisma
npm run prisma:seed
```

- `prisma:generate` — generates Prisma client from `apps/api/src/infra/prisma/schema.prisma`
- `prisma:migrate` — deploys migrations (requires `DATABASE_URL` in `.env`)
- `prisma:seed` — seeds demo data (uses `dotenv/config` from root `.env`)

**2. API**

```bash
npm run dev:api
```

- Listens on **port 3003** by default (or set `PORT` in `.env`)
- Base path: `http://localhost:3003/api`

**3. Admin Web**

```bash
npm run dev:admin
```

- **Port 3004** → http://localhost:3004  
- Set `NEXT_PUBLIC_API_URL=http://localhost:3003/api` in `apps/admin-web/.env.local` if API is on 3003

**4. Customer Web**

```bash
npm run dev:customer
```

- **Port 3002** → http://localhost:3002  
- Set `NEXT_PUBLIC_API_URL=http://localhost:3003/api` in `apps/customer-web/.env.local` if needed

## Confirmed ports

| Service       | Default port | URL                          |
|--------------|-------------|------------------------------|
| API          | 3003        | http://localhost:3003/api   |
| Admin Web    | 3004        | http://localhost:3004       |
| Customer Web | 3002        | http://localhost:3002       |

## Seeded credentials

- **Customer:** phone `+919999999999`, OTP `123456`
- **Admin:** `admin@laundry.local` / `dev-hash`
- **Billing:** `billing@laundry.local` / `dev-hash`

## Test loop: Customer → Admin → Customer

1. **Customer login (customer-web)**  
   - Open http://localhost:3002  
   - Login with phone `+919999999999` → Request OTP → Verify with `123456`  
   - You should be redirected to **My orders**

2. **Create order (customer-web)**  
   - Click **Create order**  
   - Choose service type, pickup date, time window, optional weight  
   - Submit → note the new order ID and that you’re on the order detail page  

3. **Confirm in Admin (admin-web)**  
   - Open http://localhost:3004 and log in as admin  
   - Go to **Orders**  
   - Find the new order (same ID) and open it  

4. **Progress order in Admin**  
   - Use quick actions: **Issue ACK** → **Mark Delivered** → **Issue FINAL** → **Mark Paid (Cash)**  
   - Open PDFs to confirm ACK and Final invoices  

5. **Check customer view (customer-web)**  
   - In customer-web, refresh or open **My orders** → open the same order  
   - Status should reflect **DELIVERED** and payment **CAPTURED**  

6. **Submit feedback (customer-web)**  
   - On the order detail page, use **Submit feedback** (only when DELIVERED + CAPTURED)  
   - Submit rating and optional message  

7. **Verify in Admin**  
   - In admin-web go to **Feedback**  
   - Confirm the new feedback appears and you can update status / admin notes  

## Admin Test Console

- **Path:** http://localhost:3004/test-console (after login)
- **Access:** Admin, OPS, or Billing only (RoleGate).
- **Inputs:** phone, service type, time window, estimated weight (kg), include subscription, discount (paise). Run **Run Full Flow** to execute the full order → ACK → FINAL → payment → analytics flow using those values.

## API used by Customer Web

- Customer auth: `POST /api/auth/customer/otp/request`, `POST /api/auth/customer/otp/verify`
- Customer profile: `GET /api/me` (returns user, defaultAddress, activeSubscription)
- Orders: `GET /api/orders`, `POST /api/orders`, `GET /api/orders/:id`
- Feedback: `GET /api/orders/:id/feedback/eligibility`, `POST /api/orders/:id/feedback`

Customer Web does **not** call admin-only endpoints; address and subscription IDs come from `/api/me`.
