import { Inject, Injectable } from '@nestjs/common';
import { checkServiceability } from '../../application/service-areas/check-serviceability.use-case';
import type { ServiceAreaRepo, BranchRepo } from '../../application/ports';
import { SERVICE_AREA_REPO, BRANCH_REPO } from '../../infra/infra.module';

@Injectable()
export class ServiceabilityService {
  constructor(
    @Inject(SERVICE_AREA_REPO)
    private readonly serviceAreaRepo: ServiceAreaRepo,
    @Inject(BRANCH_REPO)
    private readonly branchRepo: BranchRepo,
  ) {}

  async check(pincode: string) {
    return checkServiceability(pincode, { serviceAreaRepo: this.serviceAreaRepo, branchRepo: this.branchRepo });
  }
}
