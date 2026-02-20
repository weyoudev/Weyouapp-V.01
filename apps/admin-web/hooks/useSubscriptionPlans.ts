import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { SubscriptionPlan, CreatePlanBody, PatchPlanBody } from '@/types';

function fetchPlans(): Promise<SubscriptionPlan[]> {
  return api.get<SubscriptionPlan[]>('/admin/subscription-plans').then((r) => r.data);
}

export function useSubscriptionPlans() {
  return useQuery({
    queryKey: ['admin', 'subscription-plans'],
    queryFn: fetchPlans,
  });
}

export function useCreatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreatePlanBody) =>
      api.post<SubscriptionPlan>('/admin/subscription-plans', body).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'subscription-plans'] });
    },
  });
}

export function useUpdatePlan(planId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: PatchPlanBody) =>
      api.patch<SubscriptionPlan>(`/admin/subscription-plans/${planId}`, body).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'subscription-plans'] });
    },
  });
}
