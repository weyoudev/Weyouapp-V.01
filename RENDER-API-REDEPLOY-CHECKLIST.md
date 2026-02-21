# Fix 404: Redeploy weyou-api on Render

If the admin shows **"The endpoint was not found (404)"** for analytics, follow these steps **in order**.

## 1. Confirm branch and latest commit

- In your repo: **main** (or **master**) should have the latest code.
- On GitHub, open your repo and note the **latest commit hash** on **main** (e.g. `0b95a41`).

## 2. In Render Dashboard

1. Go to **[dashboard.render.com](https://dashboard.render.com)**.
2. Open the **weyou-api** service (the **API** backend, not weyou-admin).
3. Go to **Settings** → **Build & Deploy**:
   - **Branch:** must be **main** (or whatever branch you push to).
   - If it was wrong, change it and **Save**.
4. Go back to the service **home** (not Settings).
5. Click **Manual Deploy**.
6. Choose **"Clear build cache & deploy"** (not just "Deploy").
7. Wait until status is **Live** and the build log has **no errors**.

## 3. Confirm which commit was deployed

- On the same **weyou-api** page, check the **latest deploy**.
- It should show **Commit: &lt;hash&gt;** matching your latest **main** commit.
- If it shows an older commit, the deploy used an old snapshot. Trigger **Manual Deploy** → **Clear build cache & deploy** again after confirming **Branch** is **main**.

## 4. Test the API

- Open **https://weyou-api.onrender.com/api** → you should see JSON (`"message":"Weyou API",...`).
- Open **https://weyou-api.onrender.com/api/admin/analytics/_ping** (no auth):
  - **200** with `{"ok":true,"message":"analytics routes available"}` = **new code is live.** Then check the admin dashboard; analytics should work.
  - **404** = deploy is still serving old code; re-check branch and use **Clear build cache & deploy** again.
- Optional: **https://weyou-api.onrender.com/api/admin/analytics/dashboard-kpis** (no auth) → **401** = route exists; **404** = route missing.

## 5. Reload the admin

- Open the admin dashboard and do a **hard refresh** (Ctrl+Shift+R).

---

**If you still get 404:** In weyou-api, open the **Logs** tab and check for startup errors. If the API fails to load the admin module (e.g. missing dependency), those routes won’t be registered.
