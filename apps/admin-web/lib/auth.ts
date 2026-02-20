const TOKEN_KEY = 'admin_jwt';
const USER_KEY = 'admin_user';

export type Role = 'ADMIN' | 'OPS' | 'BILLING' | 'CUSTOMER';

export interface AuthUser {
  id: string;
  email?: string;
  phone?: string;
  role: Role;
  /** Set for OPS (branch head) users; used to restrict walk-in orders to their branch. */
  branchId?: string | null;
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function setStoredUser(user: AuthUser): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function logout(): void {
  clearAuth();
  window.location.href = '/login';
}

export function canAccessCatalogEdit(role: Role): boolean {
  return role === 'ADMIN';
}

export function canAccessPaymentEdit(role: Role): boolean {
  return role === 'ADMIN' || role === 'BILLING';
}

export function canAccessOrders(role: Role): boolean {
  return ['ADMIN', 'OPS', 'BILLING'].includes(role);
}

export function canAccessBrandingEdit(role: Role): boolean {
  return role === 'ADMIN' || role === 'BILLING';
}

export function canAccessCustomersEdit(role: Role): boolean {
  return role === 'ADMIN';
}
