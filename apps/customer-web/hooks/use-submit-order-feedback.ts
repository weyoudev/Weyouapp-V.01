import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getApiError } from '@/lib/api';
import { toast } from 'sonner';

export interface SubmitOrderFeedbackInput {
  orderId: string;
  rating: number;
  tags?: string[];
  message?: string;
}

export function useSubmitOrderFeedback() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      orderId,
      rating,
      tags,
      message,
    }: SubmitOrderFeedbackInput) => {
      const { data } = await api.post(`/orders/${orderId}/feedback`, {
        rating,
        tags,
        message,
      });
      return data;
    },
    onSuccess: (_, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: ['orders', orderId, 'feedback-eligibility'] });
      queryClient.invalidateQueries({ queryKey: ['orders', orderId] });
      toast.success('Feedback submitted');
    },
    onError: (err) => {
      toast.error(getApiError(err).message);
    },
  });
}
