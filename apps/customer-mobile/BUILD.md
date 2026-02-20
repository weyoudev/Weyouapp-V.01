# Building the Customer Mobile App (Android Beta)

This guide covers creating the **first Beta** Android build of the customer app using [EAS Build](https://docs.expo.dev/build/introduction/).

## Prerequisites

1. **Expo account** – Sign up at [expo.dev](https://expo.dev) if you don’t have one.
2. **EAS CLI** – Install and log in:
   ```bash
   npm install -g eas-cli
   eas login
   ```
3. **Link the project** (first time only) – From this directory (`apps/customer-mobile`):
   ```bash
   eas build:configure
   ```
   This uses the existing `eas.json`. When prompted, choose or create an Expo project to link.

## First Beta build (APK)

From the repo root or from `apps/customer-mobile`:

```bash
# From repo root
npm run build:android:beta -w customer-mobile

# Or from apps/customer-mobile
npm run build:android:beta
```

Or with EAS CLI directly:

```bash
cd apps/customer-mobile
eas build --platform android --profile preview
```

- **Profile**: `preview` (see `eas.json`) – internal distribution, **APK** output.
- **Output**: EAS builds in the cloud and gives you a link to download the `.apk`.
- **Install**: Share the download link with testers; they can install the APK on Android devices (allow “Install from unknown sources” if needed).

## Environment for the build

- The build uses your **app’s config** from `app.json` and any **env** you set in EAS (e.g. in [expo.dev](https://expo.dev) → Project → Build → Environment variables).
- For the app to talk to your API, set **EXPO_PUBLIC_API_URL** (or your API env var) in EAS secrets or in the `preview` profile in `eas.json` under `env`, e.g.:
  ```json
  "preview": {
    "distribution": "internal",
    "env": {
      "EXPO_PUBLIC_API_URL": "https://your-api.example.com"
    },
    "android": { "buildType": "apk" },
    "channel": "preview"
  }
  ```
  Or set it in the EAS dashboard so the built app points at your Beta API.

## Version for next Betas

Before each new Beta, bump the version so testers and stores see an update:

1. **app.json** – `expo.version` (e.g. `1.0.0` → `1.0.1`) and `expo.android.versionCode` (e.g. `1` → `2`).
2. Re-run the Beta build:
   ```bash
   npm run build:android:beta -w customer-mobile
   ```

## Production build (Play Store)

When you’re ready for Play Store (internal testing or production):

```bash
eas build --platform android --profile production
```

This produces an **AAB** (Android App Bundle) for upload to Google Play Console. Configure signing (e.g. EAS credentials) and optionally `eas submit` as in `eas.json`.

## Troubleshooting

- **“Project not configured”** – Run `eas build:configure` and link the app to an Expo project.
- **Build fails** – Check the build log on [expo.dev](https://expo.dev) → your project → Builds.
- **App can’t reach API** – Set `EXPO_PUBLIC_API_URL` (or your API base URL) in EAS env/secrets for the profile you use to build.
