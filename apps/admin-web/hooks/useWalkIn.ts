import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface WalkInCustomer {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  role: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export function useWalkInLookupCustomer(phone: string) {
  return useQuery({
    queryKey: ['admin', 'walk-in', 'customer', phone],
    queryFn: () =>
      api
        .get<{ customer: WalkInCustomer | null }>(`/admin/walk-in/customer?phone=${encodeURIComponent(phone)}`)
        .then((r) => r.data.customer),
    enabled: phone.length >= 10 && /^\+?\d+$/.test(phone.replace(/\s/g, '')),
  });
}

export function useWalkInCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { phone: string; name?: string; email?: string }) =>
      api.post<{ customer: WalkInCustomer }>('/admin/walk-in/customer', body).then((r) => r.data.customer),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'walk-in'] });
    },
  });
}

export function useWalkInCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { userId: string; branchId: string }) =>
      api.post<{ order: { id: string } }>('/admin/walk-in/orders', body).then((r) => r.data.order),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'orders'] });
      qc.invalidateQueries({ queryKey: ['admin', 'walk-in'] });
    },
  });
}
