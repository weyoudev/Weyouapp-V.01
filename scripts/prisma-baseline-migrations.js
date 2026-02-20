/**
 * Mark all existing migrations as applied without running them.
 * Use when the database already has the schema (e.g. from Supabase or manual setup)
 * but _prisma_migrations is empty or out of sync.
 *
 * Run from repo root: node scripts/prisma-baseline-migrations.js
 *
 * Then run: npm run prisma:migrate (to apply any migrations that are newer than the DB).
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const root = path.resolve(__dirname, '..');
const migrationsDir = path.join(root, 'apps/api/src/infra/prisma/migrations');
const schemaPath = path.join(root, 'apps/api/src/infra/prisma/schema.prisma');

const dirs = fs.readdirSync(migrationsDir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort()
  // Exclude migrations that should still run (e.g. add_user_branch_id if DB doesn't have it yet)
  .filter((name) => !name.includes('add_user_branch_id'));

if (dirs.length === 0) {
  console.error('No migration directories found in', migrationsDir);
  process.exit(1);
}

console.log('Marking ' + dirs.length + ' migrations as applied...\n');

for (const name of dirs) {
  try {
    execSync(
      'npx prisma migrate resolve --applied "' + name + '" --schema="' + schemaPath + '"',
      { cwd: root, stdio: 'pipe', encoding: 'utf8' }
    );
    console.log('  Applied: ' + name);
  } catch (e) {
    const out = (e.stdout || '') + (e.stderr || '') + (e.message || '');
    if (out.includes('already recorded as applied')) {
      console.log('  Skip (already applied): ' + name);
    } else {
      console.error('Failed to resolve ' + name + ':', e.message);
      if (e.stderr) console.error(e.stderr);
      process.exit(1);
    }
  }
}

console.log('\nDone. Run: npm run prisma:migrate');
