import { Inject, Injectable } from '@nestjs/common';
import { listSubscriptionPlansAdmin } from '../../../application/subscription-plans/list-subscription-plans.use-case';
import { createSubscriptionPlan } from '../../../application/subscription-plans/create-subscription-plan.use-case';
import { updateSubscriptionPlan } from '../../../application/subscription-plans/update-subscription-plan.use-case';
import type {
  CreateSubscriptionPlanInput,
  UpdateSubscriptionPlanPatch,
  SubscriptionPlansRepo,
} from '../../../application/ports';
import { SUBSCRIPTION_PLANS_REPO } from '../../../infra/infra.module';

@Injectable()
export class AdminSubscriptionPlansService {
  constructor(
    @Inject(SUBSCRIPTION_PLANS_REPO)
    private readonly subscriptionPlansRepo: SubscriptionPlansRepo,
  ) {}

  async list() {
    return listSubscriptionPlansAdmin({
      subscriptionPlansRepo: this.subscriptionPlansRepo,
    });
  }

  async create(input: CreateSubscriptionPlanInput) {
    return createSubscriptionPlan(input, {
      subscriptionPlansRepo: this.subscriptionPlansRepo,
    });
  }

  async update(id: string, patch: UpdateSubscriptionPlanPatch) {
    return updateSubscriptionPlan(id, patch, {
      subscriptionPlansRepo: this.subscriptionPlansRepo,
    });
  }
}
