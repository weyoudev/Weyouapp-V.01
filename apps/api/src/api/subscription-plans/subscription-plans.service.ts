import { Inject, Injectable } from '@nestjs/common';
import { listSubscriptionPlansActive } from '../../application/subscription-plans/list-subscription-plans.use-case';
import type { SubscriptionPlansRepo } from '../../application/ports';
import { SUBSCRIPTION_PLANS_REPO } from '../../infra/infra.module';

@Injectable()
export class SubscriptionPlansService {
  constructor(
    @Inject(SUBSCRIPTION_PLANS_REPO)
    private readonly subscriptionPlansRepo: SubscriptionPlansRepo,
  ) {}

  async listActive() {
    return listSubscriptionPlansActive({
      subscriptionPlansRepo: this.subscriptionPlansRepo,
    });
  }
}
