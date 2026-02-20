/**
 * Mark all Prisma migrations as applied without running them.
 * Use when the database already has the full schema but prisma_migrations was missing or out of sync.
 * Run from repo root: node scripts/prisma-baseline-all.js
 */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const migrationsDir = path.join(__dirname, '../apps/api/src/infra/prisma/migrations');
const schemaPath = path.join(__dirname, '../apps/api/src/infra/prisma/schema.prisma');

const dirs = fs.readdirSync(migrationsDir)
  .filter((name) => fs.statSync(path.join(migrationsDir, name)).isDirectory())
  .sort();

console.log(`Found ${dirs.length} migrations. Marking each as applied...`);
for (const name of dirs) {
  try {
    execSync(
      `npx prisma migrate resolve --schema=apps/api/src/infra/prisma/schema.prisma --applied ${name}`,
      { cwd: path.join(__dirname, '..'), stdio: 'inherit' }
    );
    console.log(`  OK: ${name}`);
  } catch (e) {
    console.error(`  Skip/fail: ${name}`, e.message || e);
  }
}
console.log('Done. Run npm run prisma:migrate to verify (should report all applied).');
