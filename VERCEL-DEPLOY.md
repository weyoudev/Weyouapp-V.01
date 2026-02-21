# Deploy API + Admin on Vercel

You can use **one project** (Admin + API on the same domain) or **two projects** (separate domains).

---

## Option A: One project (Admin + API on same domain)

**Best if:** You want a single URL like `weyouapp-v-01-admin-web-1xhg.vercel.app` for both the app and the API.

1. **Create one project** in Vercel and import this repo.
2. **Root Directory:** leave **empty** (repo root). If you set it to `apps/admin-web`, the build will fail with "Missing script: prisma:generate" because that script lives in the root.
3. **Framework Preset:** Other.
4. The repo’s **`vercel.json`** already configures:
   - Build: `npm run prisma:generate && npm run build:api` (then Next.js builds from `apps/admin-web`).
   - All `/api/*` requests → Nest API (serverless). Everything else → Next.js admin.

**Environment variables:**

- `DATABASE_URL` – PostgreSQL (e.g. Supabase).
- `JWT_SECRET` – your JWT secret.
- `NEXT_PUBLIC_API_URL` – set to **`/api`** (same origin; admin will call `https://your-project.vercel.app/api`).

After deploy:

- **Admin:** `https://your-project.vercel.app`
- **API:** `https://your-project.vercel.app/api` (e.g. `/api/health`, `/api/admin/...`)

No CORS issues because both are on the same domain.

---

## Option B: Two projects (Admin and API on different domains)

**Best if:** You want to deploy or scale API and Admin separately.

### 1. API project (e.g. `weyou-api`)

- Import this repo, **Root Directory:** empty, **Framework:** Other.
- In **Settings → General**, set **Configuration File** to **`vercel-api-only.json`** (so only the API is built).
- **Env vars:** `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production`, etc.
- Copy the deployed URL (e.g. `https://weyou-api-xxx.vercel.app`).

### 2. Admin project (e.g. `weyou-admin`)

- Import the **same** repo again.
- **Root Directory:** `apps/admin-web`.
- **Env:** `NEXT_PUBLIC_API_URL=https://weyou-api-xxx.vercel.app/api`.

---

## 404 on root or “can’t see any UI”

If you get **404: NOT_FOUND** when opening the deployment URL:

1. **Root Directory must be empty**  
   In Vercel: **Project → Settings → General → Root Directory**. Leave it **blank**. If it’s set to `apps/admin-web`, the root `vercel.json` is not used and `/` won’t be served by the Next app.

2. **Framework Preset: Other**  
   In **Settings → General → Framework Preset**, choose **Other** so Vercel uses `vercel.json` (buildCommand + builds) instead of auto-detecting Next only.

3. **Redeploy after changing settings**  
   Use **Deployments → … on latest → Redeploy** (or push a new commit) so the new settings apply.

4. **Try /login**  
   Open `https://your-project.vercel.app/login`. If that works but `/` doesn’t, the app is deployed; the root page may be cached. If `/login` also 404s, Root Directory or Framework Preset is still wrong.

### Still 404? Use two projects (recommended fix)

When the single-project setup keeps returning 404, use **two Vercel projects**: one for the API (current), one for the Admin UI. The Admin project will serve the UI at `/` with no 404.

**Step 1 – Keep current project as API (optional)**  
In the **current** project (e.g. `weyouapp-v-01-admin-web-1xhg`): **Settings → General → Configuration File** set to **`vercel-api-only.json`**, then Save and Redeploy. That project will then only build and serve the API at `https://your-project.vercel.app/api`.

**Step 2 – Create a new project for the Admin UI**  
1. In Vercel: **Add New Project** → import the **same** repo (`weyoudev/Weyouapp-V.01`).  
2. **Project name:** e.g. `weyou-admin`.  
3. **Root Directory:** set to **`apps/admin-web`**.  
4. **Framework Preset:** **Next.js**.  
5. **Build Command:** the repo has `apps/admin-web/vercel.json` so only `npm run build` runs (no Prisma/API). If you see "Missing script: prisma:generate", override **Build Command** in Settings to **`npm run build`**.  
6. **Environment variables:** add **`NEXT_PUBLIC_API_URL`** = **`https://weyouapp-v-01-admin-web-1xhg.vercel.app/api`** (your current project URL + `/api`).  
7. Deploy.

**Step 3 – Use the new URL**  
Open the **new** project's URL (e.g. `https://weyou-admin-xxx.vercel.app`). You should see the Admin UI. The admin app will call the API at the URL you set. CORS already allows `*.vercel.app`.

---

## CORS

The API allows:

- `https://weyou-admin.onrender.com`
- `https://*.vercel.app`
- `http://localhost:*` and `http://127.0.0.1:*`

To add another admin domain, edit `apps/api/src/bootstrap/create-app.ts` (`allowedOrigins`).

---

## Summary

| Setup   | Root Directory   | Result |
|--------|-------------------|--------|
| **One project** | (empty) | One URL: app at `/`, API at `/api`. Set `NEXT_PUBLIC_API_URL=/api`. |
| **Two projects** | (empty) for API, `apps/admin-web` for Admin | Two URLs; set admin’s `NEXT_PUBLIC_API_URL` to the API project URL + `/api`. |
