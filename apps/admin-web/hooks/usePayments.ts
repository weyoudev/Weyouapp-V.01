import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { UpdatePaymentBody } from '@/types';

async function updatePayment(orderId: string, body: UpdatePaymentBody) {
  const { data } = await api.patch(`/admin/orders/${orderId}/payment`, body);
  return data;
}

export function useUpdatePayment(orderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdatePaymentBody) => updatePayment(orderId, body),
    onSuccess: async () => {
      await Promise.all([
        qc.refetchQueries({ queryKey: ['admin', 'orders', orderId] }),
        qc.invalidateQueries({ queryKey: ['admin', 'orders'], exact: false }),
        qc.invalidateQueries({ queryKey: ['admin', 'final-invoices'], exact: false }),
      ]);
    },
  });
}
