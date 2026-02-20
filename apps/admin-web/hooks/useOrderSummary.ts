import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { OrderAdminSummary } from '@/types';

function fetchOrderSummary(orderId: string): Promise<OrderAdminSummary> {
  return api.get<OrderAdminSummary>(`/admin/orders/${orderId}/summary`).then((r) => r.data);
}

export function useOrderSummary(orderId: string | null) {
  return useQuery({
    queryKey: ['admin', 'orders', orderId],
    queryFn: () => fetchOrderSummary(orderId!),
    enabled: !!orderId,
  });
}
