import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getApiError } from '@/lib/api';
import { toast } from 'sonner';

export interface OrderListItem {
  id: string;
  status: string;
  serviceType: string;
  pickupDate: string;
  timeWindow: string;
  createdAt: string;
}

export interface OrderDetail extends OrderListItem {
  userId: string;
  addressId: string;
  pincode: string;
  estimatedWeightKg: number | null;
  actualWeightKg: number | null;
  subscriptionId: string | null;
  paymentStatus: string;
  updatedAt: string;
}

export function useOrders() {
  return useQuery({
    queryKey: ['orders'],
    queryFn: async (): Promise<OrderListItem[]> => {
      const { data } = await api.get<OrderListItem[]>('/orders');
      return data;
    },
  });
}

export function useOrder(id: string | null) {
  return useQuery({
    queryKey: ['orders', id],
    queryFn: async (): Promise<OrderDetail> => {
      if (!id) throw new Error('No order id');
      const { data } = await api.get<OrderDetail>(`/orders/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export interface CreateOrderInput {
  orderType?: 'INDIVIDUAL' | 'SUBSCRIPTION' | 'BOTH';
  serviceType?: string;
  selectedServices?: string[];
  addressId: string;
  pickupDate: string;
  timeWindow: string;
  estimatedWeightKg?: number;
  /** Optional: use existing subscription. Omit for subscription opt-in (admin assigns plan at pickup). */
  subscriptionId?: string;
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateOrderInput): Promise<{ orderId: string; orderType?: string }> => {
      const { data } = await api.post<{ orderId: string; orderType?: string }>('/orders', input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order created');
    },
    onError: (err) => {
      toast.error(getApiError(err).message);
    },
  });
}
