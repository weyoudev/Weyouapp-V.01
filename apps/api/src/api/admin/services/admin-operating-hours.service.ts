import { Inject, Injectable } from '@nestjs/common';
import type { OperatingHoursRepo } from '../../../application/ports';
import { OPERATING_HOURS_REPO } from '../../../infra/infra.module';

@Injectable()
export class AdminOperatingHoursService {
  constructor(
    @Inject(OPERATING_HOURS_REPO)
    private readonly operatingHoursRepo: OperatingHoursRepo,
  ) {}

  async get(branchId: string | null) {
    return this.operatingHoursRepo.get(branchId);
  }

  async set(branchId: string, startTime: string, endTime: string) {
    return this.operatingHoursRepo.set(branchId, startTime, endTime);
  }
}
