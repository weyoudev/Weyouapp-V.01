import { AppError } from '../errors';
import type {
  SubscriptionPlansRepo,
  SubscriptionPlanRecord,
  UpdateSubscriptionPlanPatch,
} from '../ports';
import { validateDescriptionWordLimit } from './description-word-limit';

export interface UpdateSubscriptionPlanDeps {
  subscriptionPlansRepo: SubscriptionPlansRepo;
}

export async function updateSubscriptionPlan(
  id: string,
  patch: UpdateSubscriptionPlanPatch,
  deps: UpdateSubscriptionPlanDeps,
): Promise<SubscriptionPlanRecord> {
  const existing = await deps.subscriptionPlansRepo.getById(id);
  if (!existing) {
    throw new AppError('PLAN_NOT_FOUND', 'Subscription plan not found', { id });
  }
  const normalizedPatch = { ...patch };
  if (patch.description !== undefined) {
    normalizedPatch.description = validateDescriptionWordLimit(patch.description);
  }
  return deps.subscriptionPlansRepo.update(id, normalizedPatch);
}
