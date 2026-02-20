import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { AdminFeedbackResponse, FeedbackStatus } from '@/types';

interface FeedbackFilters {
  type?: string;
  status?: FeedbackStatus;
  rating?: number;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  cursor?: string;
}

function fetchFeedback(filters: FeedbackFilters): Promise<AdminFeedbackResponse> {
  const params = new URLSearchParams();
  if (filters.type) params.set('type', filters.type);
  if (filters.status) params.set('status', filters.status);
  if (filters.rating != null) params.set('rating', String(filters.rating));
  if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
  if (filters.dateTo) params.set('dateTo', filters.dateTo);
  params.set('limit', String(filters.limit ?? 20));
  if (filters.cursor) params.set('cursor', filters.cursor);
  return api.get<AdminFeedbackResponse>(`/admin/feedback?${params.toString()}`).then((r) => r.data);
}

export function useFeedbackList(filters: FeedbackFilters) {
  return useQuery({
    queryKey: ['admin', 'feedback', filters],
    queryFn: () => fetchFeedback(filters),
  });
}

export function useUpdateFeedbackStatus(feedbackId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { status: FeedbackStatus; adminNotes?: string }) =>
      api.patch(`/admin/feedback/${feedbackId}`, body).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'feedback'] });
    },
  });
}
