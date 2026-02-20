import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { OrderStatus } from '@/types';

export interface UpdateOrderStatusPayload {
  status: OrderStatus;
  reason?: string;
}

async function updateOrderStatus(orderId: string, payload: UpdateOrderStatusPayload) {
  const { data } = await api.patch<{ orderId: string; status: OrderStatus }>(
    `/orders/${orderId}/status`,
    { status: payload.status, ...(payload.reason != null && { reason: payload.reason }) }
  );
  return data;
}

export function useUpdateOrderStatus(orderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: OrderStatus | UpdateOrderStatusPayload) =>
      updateOrderStatus(orderId, typeof payload === 'string' ? { status: payload } : payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'orders', orderId] });
    },
  });
}
