#!/usr/bin/env node
'use strict';
/**
 * Run Next.js build from apps/admin-web so cwd is correct on Vercel.
 * Usage: node scripts/vercel-build-admin.js (from repo root)
 */
const path = require('path');
const { execSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const adminRoot = path.join(repoRoot, 'apps', 'admin-web');
process.chdir(adminRoot);
execSync('npx next build', { stdio: 'inherit', cwd: adminRoot });
