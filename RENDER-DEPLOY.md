# Fix 404: Redeploy the API on Render

If the mobile app shows **"Request failed (404). The API may need to be redeployed"**, the live API on Render is running old code that doesn’t have the `GET /api` (and `GET /`) routes.

## Steps

1. **Push latest code** (if you haven’t already):
   ```bash
   git add -A
   git commit -m "API: GET / and GET /api for mobile connection test"
   git push origin master
   ```

2. **In Render Dashboard**
   - Open [dashboard.render.com](https://dashboard.render.com)
   - Open the **weyou-api** service
   - If it didn’t auto-deploy: click **Manual Deploy** → **Deploy latest commit**
   - Wait until the deploy status is **Live** (and the build log shows no errors)

3. **Check that the API responds**
   - In a browser, open: **https://weyou-api.onrender.com/api**
   - You should see JSON like: `{"message":"Weyou API","api":"/api",...}`
   - If you see 404 or an error page, the deploy didn’t pick up the latest code (wrong branch or failed build).

4. **Retry in the mobile app**
   - Restart or reload the app and try again.

## If you use a different branch

In Render: **weyou-api** → **Settings** → **Build & Deploy** → set **Branch** to the one you push to (e.g. `master` or `main`), then trigger a deploy from that branch.
