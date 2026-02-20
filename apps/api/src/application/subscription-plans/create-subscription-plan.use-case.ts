import type {
  SubscriptionPlansRepo,
  SubscriptionPlanRecord,
  CreateSubscriptionPlanInput,
} from '../ports';
import { validateDescriptionWordLimit } from './description-word-limit';

export interface CreateSubscriptionPlanDeps {
  subscriptionPlansRepo: SubscriptionPlansRepo;
}

export async function createSubscriptionPlan(
  input: CreateSubscriptionPlanInput,
  deps: CreateSubscriptionPlanDeps,
): Promise<SubscriptionPlanRecord> {
  const description = validateDescriptionWordLimit(input.description);
  return deps.subscriptionPlansRepo.create({ ...input, description: description ?? undefined });
}
