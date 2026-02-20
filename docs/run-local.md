# Run backend locally

## Prerequisites

- Node.js 18+
- PostgreSQL running (e.g. local or Docker)
- `DATABASE_URL` set (see `.env.example`)

## 1. Install dependencies

From repo root:

```bash
npm install
```

## 2. Configure environment

Copy env example and set `DATABASE_URL`:

```bash
cp .env.example .env
# Edit .env: set DATABASE_URL (see below)
```

- **Local Postgres:** `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/laundry_app"`
- **Supabase:** Use the **direct** connection URI from Project → Settings → Database. Format:
  `postgresql://postgres:<PASSWORD>@db.<PROJECT_REF>.supabase.co:5432/postgres?sslmode=require`
  - Replace `<PASSWORD>` with your database password (not your Supabase account password). **Do not leave angle brackets in the value.**
  - Append `?sslmode=require` (required for Prisma).
  - **Special characters in password:** URL-encode them (e.g. `@` → `%40`, `#` → `%23`, `/` → `%2F`).

Optional: copy `apps/api/.env.example` to `apps/api/.env` if running from `apps/api`.

## 3. Start PostgreSQL

Example with Docker:

```bash
docker run -d --name laundry-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=laundry_app -p 5432:5432 postgres:16-alpine
```

Create the database if it doesn’t exist:

```bash
# If needed: createdb laundry_app
```

## 4. Prisma: generate client and run migrations

From repo root:

```bash
npm run prisma:generate
npm run prisma:migrate
```

For development (creates new migration from schema changes):

```bash
npm run prisma:migrate:dev
```

## 5. Seed the database (demo data)

```bash
npm run prisma:seed
```

This creates a full, deterministic demo dataset:

- One CUSTOMER user + admin and billing users
- Service area `500081` with today/tomorrow pickup slots
- Wash pricing configs, dry-clean catalog items, LaundryItems + LaundryItemPrices
- A subscription plan (variant, limits, pricePaise) and active subscription for the demo customer
- Branding settings (including UPI id/payee) and a default address for the customer
- One delivered order with FINAL issued invoice and CAPTURED payment (for analytics)
- One sample ORDER feedback linked to that delivered order (optional; seed creates it if missing)

See `docs/seeded-data.md` for exact values. After the backend expansion migration (`20260211150000_backend_expansion`), run seed again to populate new tables and UPI/analytics data.

## 6. Run tests

From repo root:

```bash
npm test
```

This runs application-layer tests (`apps/api/src/application/__tests__/**/*.spec.ts`) and optional Prisma integration tests (`apps/api/test/infra/**/*.spec.ts`). Integration tests require `DATABASE_URL` (or `DATABASE_URL_TEST`) and truncate tables; set `SKIP_DB_TESTS=1` to skip them.

## 7. Start the API

```bash
npm run dev:api
```

API base URL: `http://localhost:3000/api`

## 8. Manual smoke test via HTTP

1. **Customer OTP login**
   - POST `{{baseUrl}}/auth/customer/otp/request` with phone `+919999999999`
   - POST `{{baseUrl}}/auth/customer/otp/verify` with phone `+919999999999`, otp `123456`, requestId from previous step
   - Copy `token` into Postman/Thunder variable `tokenCustomer`
2. **Admin/Billing login**
   - POST `{{baseUrl}}/auth/admin/login` with email `admin@laundry.local`, password `dev-hash` (for ADMIN) or `billing@laundry.local` for BILLING
   - Copy tokens into `tokenAdmin` / `tokenBilling`
3. **Create order**
   - Use seeded customer addressId + subscriptionId from `docs/seeded-data.md` (or query via Prisma Studio)
   - POST `{{baseUrl}}/orders` with `estimatedWeightKg >= 3` and subscriptionId
4. **Update status**
   - PATCH `{{baseUrl}}/orders/{orderId}/status` as ADMIN/OPS
5. **Invoice flow**
   - POST `{{baseUrl}}/orders/{orderId}/invoice/draft` with line items
   - POST `{{baseUrl}}/orders/{orderId}/invoice/finalize`
   - POST `{{baseUrl}}/orders/{orderId}/invoice/generate-pdf` → returns `pdfUrl`
   - **PDF verification**: GET `{{baseUrl}}/invoices/{invoiceId}/pdf` (with `Authorization: Bearer <token>`) streams the PDF. Use the `invoiceId` from draft/issue responses.
6. **Branding uploads** (ADMIN/BILLING)
   - POST `{{baseUrl}}/admin/branding/logo` with form-data key `file` (image: PNG/JPG)
   - POST `{{baseUrl}}/admin/branding/upi-qr` with form-data key `file` (image)
   - Stored files are served at GET `{{baseUrl}}/assets/branding/{fileName}` (public). Set `LOCAL_STORAGE_ROOT` in `.env` (default `./storage`) for local file storage.
7. **Customer feedback**
   - **Order feedback** (only when order is DELIVERED and payment CAPTURED):  
     GET `{{baseUrl}}/orders/{orderId}/feedback/eligibility` (as customer) → `{ eligible, reason?, alreadySubmitted }`  
     POST `{{baseUrl}}/orders/{orderId}/feedback` with body `{ "rating": 1..5, "tags": ["quality"], "message": "..." }` (as customer).
   - **General feedback** (any time):  
     POST `{{baseUrl}}/feedback` with body `{ "rating": 1..5, "tags": ["app"], "message": "..." }` (as customer).  
     GET `{{baseUrl}}/feedback` to list the customer’s own feedback.
   - **Admin**: GET `{{baseUrl}}/admin/feedback?type=&status=&rating=&dateFrom=&dateTo=&limit=&cursor=` (ADMIN/OPS), PATCH `{{baseUrl}}/admin/feedback/{id}` with `{ "status": "NEW"|"REVIEWED"|"RESOLVED", "adminNotes": "..." }`.

You can import `docs/api-collection.json` into Postman/Thunder to try all endpoints quickly.

## 9. Automated smoke test

With the API running on `http://localhost:3000/api`:

```bash
npm run smoke:test
```

This will:

- Log in the seeded customer and billing/admin users
- Discover seeded `addressId` and `subscriptionId` via Prisma
- Create a WASH_FOLD order (>= 3kg) with subscription applied
- Step the order status through two valid transitions
- Create an invoice draft, finalize it, and generate a PDF
- Print a final `SMOKE_OK { orderId, invoiceId, pdfUrl }` line on success

## 10. Admin flow smoke test (ACK + FINAL + payment + analytics + feedback)

With the API running:

```bash
npm run smoke-admin
```

This will:

- Log in customer, admin, and billing
- Create an order and move it to PICKED_UP
- Create and issue ACK invoice (PDF generated and stored)
- Move order to DELIVERED, create and issue FINAL invoice (PDF generated)
- Update payment to CAPTURED
- Assert analytics revenue (billed and collected > 0)
- Submit order feedback and assert admin can list it
- Print `SMOKE_ADMIN_OK { orderId, finalInvoiceId }` on success

## Verification steps

After configuring `DATABASE_URL` in `.env` (repo root), run in order:

1. **Generate Prisma Client**
   ```bash
   npx prisma generate --schema=apps/api/src/infra/prisma/schema.prisma
   ```
   Succeeds if the schema file is valid.

2. **Apply migrations**
   ```bash
   npx prisma migrate deploy --schema=apps/api/src/infra/prisma/schema.prisma
   ```
   Applies pending migrations to the database. **If it fails** (e.g. "schema drift", "migration failed"), the DB schema may not match the app schema. Do **not** destroy production data. See "If migrate deploy fails" below.

3. **Seed the database**
   ```bash
   npm run prisma:seed
   ```
   Loads demo data. Requires migrations to have been applied.

**If migrate deploy fails** (e.g. "The database schema is not in sync with the migration history"):

- **New Supabase project (recommended for dev):** Create a fresh Supabase project and set its connection string in `.env`. Run `migrate deploy` and `prisma:seed` there. Your app schema is the source of truth; a clean DB will accept all migrations.
- **Optional reset (destructive, dev only):** Only on a database that has no data you need. See "Optional: reset database (destructive)" below.

## Optional: reset database (destructive)

Use **only** on a development database where you are okay losing all data. Do not run on production.

From repo root:

```bash
npx prisma migrate reset --schema=apps/api/src/infra/prisma/schema.prisma
```

This drops the database, recreates it, applies all migrations, and runs the seed. On Windows you may be prompted to confirm; ensure you are targeting the correct DB (check `DATABASE_URL`).

Alternatively, you can run raw SQL in Supabase SQL Editor to drop and recreate the `public` schema (all app tables). Only if you understand the impact:

```sql
-- DESTRUCTIVE: drops all tables in public. Dev/fresh DB only.
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```

After that, run `npx prisma migrate deploy` and `npm run prisma:seed` again.

## Useful commands

| Command | Description |
|--------|-------------|
| `npm run prisma:generate` | Generate Prisma Client from schema |
| `npm run prisma:migrate` | Apply migrations (deploy) |
| `npm run prisma:migrate:dev` | Create and apply migration in dev |
| `npm run prisma:studio` | Open Prisma Studio UI |
| `npm run prisma:pull` | Introspect DB into `schema.supabase.prisma` (never overwrites app schema) |
| `npm run prisma:seed` | Run seed script |
| `npm run smoke:test` | Run legacy smoke test (draft → finalize → generate-pdf) |
| `npm run smoke-admin` | Run admin flow smoke (ACK/FINAL issue, payment, analytics, feedback) |

## Troubleshooting

- **Database connection failed / credentials not valid**
  1. Ensure PostgreSQL is running (see step 3 above; e.g. `docker run -d --name laundry-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=laundry_app -p 5432:5432 postgres:16-alpine`).
  2. In repo root `.env`, set `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/laundry_app"` (match user/password/db to your Postgres).
  3. **Supabase:** In Supabase dashboard go to **Project → Settings → Database**. Use the **Connection string** tab and copy the **URI** (direct connection, port 5432). Replace `[YOUR-PASSWORD]` with your **database password** (the one you set for the project). **Add `?sslmode=require`** at the end (required for Prisma). Example:
     ```env
     DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres?sslmode=require"
     ```
     Or for **direct** connection (recommended for Prisma):
     ```env
     DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres?sslmode=require"
     ```
     Ensure the project is not **paused** (open the project in the dashboard to wake it).
  4. Restart the API after changing `.env`.

- **DATABASE_URL**: Must be set in `.env` (root or `apps/api`) when running migrate/seed or the API.
- **Port in use (EADDRINUSE 3003)**  
  Either free the port or use another one:
  1. **Free port 3003:** In PowerShell (as Administrator if needed): `netstat -ano | findstr :3003` → note the PID (last column) → `taskkill /PID <pid> /F`. Or stop all Node: `Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force`.
  2. **Use another port:** In repo root `.env` set `PORT=3005`. In `apps/admin-web/.env.local` set `NEXT_PUBLIC_API_URL=http://localhost:3005/api`. Then start the API again; it will listen on 3005.
- **Prisma client not found**: Run `npm run prisma:generate` from repo root.

- **Schema overwritten by `db pull`:** The app schema (source of truth) is `apps/api/src/infra/prisma/schema.prisma`. Never run `prisma db pull` without `--schema=...` pointing at the **introspection** file. To restore the app schema:
  1. If you use git: `git checkout -- apps/api/src/infra/prisma/schema.prisma`
  2. Otherwise restore from a backup if you have one. To introspect without overwriting the app schema, use: `npm run prisma:pull` (writes to `schema.supabase.prisma` only).

### npm install errors

- **`Unknown env config "devdir"`**  
  This warning comes from your npm environment. To remove it:
  - Run: `npm config delete devdir`
  - Or unset the env var: `NPM_CONFIG_DEVDIR` (remove it from your shell profile or System Environment Variables).

- **`ERR_SSL_CIPHER_OPERATION_FAILED`** (when fetching from registry.npmjs.org)  
  Usually caused by OpenSSL, antivirus, or proxy. Try:
  1. Use a different Node.js version (e.g. LTS 20).
  2. Temporarily disable VPN or antivirus and run `npm install` again.
  3. As a last resort, temporary workaround (insecure): from repo root run  
     `npm config set strict-ssl false`, then `npm install`, then **re-enable**: `npm config set strict-ssl true`.
