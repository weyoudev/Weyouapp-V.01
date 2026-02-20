'use client';

import { type Role } from '@/lib/auth';
import {
  canAccessCatalogEdit,
  canAccessPaymentEdit,
  canAccessOrders,
  canAccessBrandingEdit,
  canAccessCustomersEdit,
} from '@/lib/auth';

export type Gate = 'orders' | 'catalogEdit' | 'paymentEdit' | 'brandingEdit' | 'customersEdit';

const GATES: Record<Gate, (role: Role) => boolean> = {
  orders: canAccessOrders,
  catalogEdit: canAccessCatalogEdit,
  paymentEdit: canAccessPaymentEdit,
  brandingEdit: canAccessBrandingEdit,
  customersEdit: canAccessCustomersEdit,
};

interface RoleGateProps {
  role: Role;
  gate: Gate;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RoleGate({ role, gate, children, fallback = null }: RoleGateProps) {
  const allowed = GATES[gate](role);
  if (!allowed) return <>{fallback}</>;
  return <>{children}</>;
}
