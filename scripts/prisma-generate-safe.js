/**
 * Stops all Node processes then runs prisma generate (fixes EPERM on Windows when API holds the engine).
 * Run from repo root: npm run prisma:generate:safe
 */
const { spawn } = require('child_process');
const path = require('path');

const isWin = process.platform === 'win32';
const root = path.resolve(__dirname, '..');

if (isWin) {
  const cmdPath = path.join(__dirname, 'prisma-generate-safe.cmd');
  spawn('cmd', ['/c', cmdPath], { cwd: root, stdio: 'inherit', shell: true });
} else {
  const cmd = 'pkill node || true; sleep 2; npm run prisma:generate';
  spawn('sh', ['-c', cmd], { cwd: root, stdio: 'inherit', shell: true });
}
