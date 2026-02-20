/**
 * Downloads the branding logo from the API and saves it as the app icon.
 * Run from repo root: node apps/customer-mobile/scripts/update-icon-from-branding.js
 * Requires: EXPO_PUBLIC_API_URL in .env (e.g. https://weyou-api.onrender.com or http://localhost:3006)
 * Ensure a logo is uploaded in admin branding first.
 */

const fs = require('fs');
const path = require('path');

function readEnvVar(envPath, key) {
  if (!fs.existsSync(envPath)) return null;
  const env = fs.readFileSync(envPath, 'utf8');
  const m = env.match(new RegExp(key + '=(.+)'));
  if (!m) return null;
  return m[1].trim().replace(/^["']|["']$/g, '').split('#')[0].trim();
}

async function main() {
  const appDir = path.resolve(__dirname, '..');
  const rootDir = path.resolve(__dirname, '../../..');
  const appEnv = path.join(appDir, '.env');
  const rootEnv = path.join(rootDir, '.env');
  // Logo URL: 1) CLI arg, 2) apps/customer-mobile/.env, 3) process.env, 4) root .env
  const cliUrl = process.argv[2] && process.argv[2].startsWith('http') ? process.argv[2].trim() : '';
  const directLogoUrl = cliUrl || readEnvVar(appEnv, 'UPDATE_ICON_LOGO_URL') || process.env.UPDATE_ICON_LOGO_URL || readEnvVar(rootEnv, 'UPDATE_ICON_LOGO_URL');
  let API_BASE = readEnvVar(appEnv, 'EXPO_PUBLIC_API_URL') || readEnvVar(rootEnv, 'EXPO_PUBLIC_API_URL') || process.env.EXPO_PUBLIC_API_URL || '';
  if (!directLogoUrl && !API_BASE) {
    console.error('Set EXPO_PUBLIC_API_URL or UPDATE_ICON_LOGO_URL in apps/customer-mobile/.env');
    console.error('Or pass the logo URL: npm run update-icon-from-branding -- https://weyou-api.onrender.com/api/assets/branding/logo.png');
    process.exit(1);
  }
  const base = API_BASE ? API_BASE.replace(/\/$/, '') : '';
  let fullUrl;
  if (directLogoUrl && directLogoUrl.trim()) {
    fullUrl = directLogoUrl.trim();
    console.log('Using logo URL:', fullUrl);
  } else {
    const brandingUrl = `${base}/api/branding/public`;
    console.log('Fetching branding from', brandingUrl);
    const res = await fetch(brandingUrl);
    if (!res.ok) {
      if (res.status === 404) {
        console.error('GET /api/branding/public returned 404.');
        console.error('Use a direct logo URL instead:');
        console.error('  npm run update-icon-from-branding -- https://weyou-api.onrender.com/api/assets/branding/YOUR_FILE.png');
        console.error('(Get YOUR_FILE from the admin branding screen, or try logo.png / weyou-logo.png)');
      } else {
        console.error('Branding API returned', res.status, '- is the API running and does branding have a logo?');
      }
      process.exit(1);
    }
    const data = await res.json();
    const logoUrl = data.logoUrl;
    if (!logoUrl || !logoUrl.trim()) {
      console.error('No logoUrl in branding. Upload a logo in the admin branding settings, or set UPDATE_ICON_LOGO_URL in .env to the full logo image URL.');
      process.exit(1);
    }
    fullUrl = logoUrl.startsWith('http') ? logoUrl : `${base}${logoUrl.startsWith('/') ? '' : '/'}${logoUrl}`;
  }
  const imgRes = await fetch(fullUrl);
  if (!imgRes.ok) {
    console.error('Failed to download logo:', imgRes.status, fullUrl);
    process.exit(1);
  }
  const buf = Buffer.from(await imgRes.arrayBuffer());
  const assetsDir = path.join(__dirname, '..', 'assets');
  if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });
  const iconPath = path.join(assetsDir, 'icon.png');
  const adaptivePath = path.join(assetsDir, 'adaptive-icon.png');
  const splashPath = path.join(assetsDir, 'splash-icon.png');
  const faviconPath = path.join(assetsDir, 'favicon.png');
  fs.writeFileSync(iconPath, buf);
  fs.writeFileSync(adaptivePath, buf);
  fs.writeFileSync(splashPath, buf);
  fs.writeFileSync(faviconPath, buf);
  console.log('Updated icon, adaptive-icon, splash-icon, and favicon from branding logo.');
  console.log('Rebuild the app (or restart Expo) to see the new icon.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
