import * as crypto from 'crypto';

const DEFAULT_SALT = 'dev-salt';

export function getAdminPasswordSalt(): string {
  return process.env.ADMIN_PASSWORD_SALT || DEFAULT_SALT;
}

export function hashAdminPassword(plain: string): string {
  const salt = getAdminPasswordSalt();
  return crypto.createHash('sha256').update(`${salt}:${plain}`).digest('hex');
}

export function generateTempPassword(length = 12): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  let out = '';
  for (let i = 0; i < length; i += 1) {
    const idx = Math.floor(Math.random() * chars.length);
    out += chars[idx];
  }
  return out;
}

