# Connect to Supabase (PostgreSQL)

## 1. Get your connection string

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project.
2. Go to **Settings** (gear) → **Database**.
3. Under **Connection string**, choose **URI**.
4. Copy the URI. It will look like:
   - **Direct:** `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres`
   - **Pooler:** `postgresql://postgres.[PROJECT_REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres`

5. Replace `[YOUR-PASSWORD]` with your **database password** (Project Settings → Database → Database password, or the one you set when creating the project). This is **not** your Supabase account password.

## 2. Add SSL (required for Prisma)

Prisma needs SSL to connect to Supabase. Append this to the URI:

```
?sslmode=require
```

So the full value in `.env` should look like:

```env
# Direct connection (recommended for Prisma + migrations)
DATABASE_URL="postgresql://postgres:YOUR_ACTUAL_PASSWORD@db.xxxxxxxxxxxx.supabase.co:5432/postgres?sslmode=require"
```

Or with pooler (use **Session mode** port 5432, not 6543, if you use pooler):

```env
DATABASE_URL="postgresql://postgres.xxxxxxxxxxxx:YOUR_ACTUAL_PASSWORD@aws-0-xx-x.pooler.supabase.com:5432/postgres?sslmode=require"
```

## 3. Set in `.env`

In the **repo root** (e.g. `E:\WeYouApp\.env`), set:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres?sslmode=require"
```

Use your real password and project ref; no quotes inside the URL.

## 4. Wake the project (if paused)

Free-tier projects pause after inactivity. Open your project in the dashboard so it’s running.

## 5. Avoid P1000 (Authentication failed)

If you see **P1000** with the pooler, the username or password in your URL doesn’t match Supabase. Use the **exact** URI from the dashboard and replace only the password:

1. In the dashboard, click **Connect** (top of the project page) or go to **Settings → Database**.
2. Under **Connection string**, open the **Connection pooling** tab and select **Session mode** (port 5432).
3. Copy the **URI** shown (it will look like `postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-xx-x.pooler.supabase.com:5432/postgres` or similar with `aws-1-`).
4. **Reset your database password** if needed: **Settings → Database → Database password → Reset database password**. Set a simple alphanumeric password and save.
5. In the copied URI, replace **only** `[YOUR-PASSWORD]` with that password. If the placeholder is different (e.g. `your-password`), replace that. Do not change the host or the `postgres.xxxxx` part.
6. Add `?sslmode=require` at the end if it’s not there.
7. Put the result in `.env` as `DATABASE_URL="..."` (one line, no extra spaces). Use double quotes.

The host can be `aws-0-...` or `aws-1-...` depending on your project; always use what the dashboard shows.

## 6. Run migrations and seed

From repo root:

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

If these succeed, the API can connect. Restart the API (`npm run dev:api`) and try again.

## Row Level Security (RLS)

Supabase enables RLS on some tables by default. Prisma can **introspect** the schema, but RLS policies may **block** server-side queries (e.g. from the NestJS API) if the connection user is not allowed by the policy.

**Two safe options:**

1. **Keep RLS:** Ensure the database user in `DATABASE_URL` (e.g. `postgres`) either bypasses RLS (e.g. table owner or a role with `BYPASSRLS`) or has policies that allow the operations your app needs. Configure policies in Supabase Dashboard → Authentication → Policies (or via SQL).

2. **Disable RLS for app-owned tables (dev only):** Use only on a **development** database where you accept that all rows are visible to the connection. Run the following at your own risk; it is **destructive** of RLS protection on those tables.

   ```sql
   -- Optional: disable RLS on app tables (dev only; not for production)
   ALTER TABLE "Address" DISABLE ROW LEVEL SECURITY;
   ALTER TABLE "SubscriptionUsage" DISABLE ROW LEVEL SECURITY;
   -- Add other app tables if needed.
   ```

Do **not** run the above on production if you rely on RLS for multi-tenant or row-level access control.

## Troubleshooting

- **P1001: Can't reach database server**  
  Usually means the project is **paused** or your network can’t reach Supabase.
  1. Open [Supabase Dashboard](https://supabase.com/dashboard) and click your project. If it was paused, it will wake (wait 1–2 minutes).
  2. In the dashboard, go to **Settings → Database** and confirm the **Connection string (URI)**. Use the **direct** connection: host `db.<project-ref>.supabase.co`, port **5432**.
  3. If you’re on a restricted network (office/VPN/firewall), port 5432 might be blocked. Try the **Connection pooling** URI instead (Session mode, port **5432**): host like `aws-0-<region>.pooler.supabase.com`, and add `?sslmode=require` to the URL in `.env`.
  4. From your machine, test reachability: `ping db.lgykizwycdkfkwxidpro.supabase.co` (or your project host). If ping is blocked, try the pooler host.

- **Authentication failed / credentials not valid**  
  Double-check the **database password** (Settings → Database). Reset it if needed and update `.env`.

- **Connection timeout / ECONNREFUSED**  
  Ensure the project is not paused and you’re using the correct host (e.g. `db.xxx.supabase.co` for direct).

- **SSL required**  
  Always add `?sslmode=require` to the end of `DATABASE_URL`.
