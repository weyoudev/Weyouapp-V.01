import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface FeedbackEligibility {
  eligible: boolean;
  reason?: string;
  alreadySubmitted: boolean;
}

export function useFeedbackEligibility(orderId: string | null) {
  return useQuery({
    queryKey: ['orders', orderId, 'feedback-eligibility'],
    queryFn: async (): Promise<FeedbackEligibility> => {
      if (!orderId) throw new Error('No order id');
      const { data } = await api.get<FeedbackEligibility>(
        `/orders/${orderId}/feedback/eligibility`
      );
      return data;
    },
    enabled: !!orderId,
  });
}
