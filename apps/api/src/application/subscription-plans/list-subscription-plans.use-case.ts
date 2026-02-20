import type { SubscriptionPlansRepo, SubscriptionPlanRecord } from '../ports';

export interface ListSubscriptionPlansDeps {
  subscriptionPlansRepo: SubscriptionPlansRepo;
}

export async function listSubscriptionPlansAdmin(
  deps: ListSubscriptionPlansDeps,
): Promise<SubscriptionPlanRecord[]> {
  return deps.subscriptionPlansRepo.listAll();
}

export async function listSubscriptionPlansActive(
  deps: ListSubscriptionPlansDeps,
): Promise<SubscriptionPlanRecord[]> {
  return deps.subscriptionPlansRepo.listActive();
}
