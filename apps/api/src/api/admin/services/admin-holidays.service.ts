import { Inject, Injectable } from '@nestjs/common';
import type { HolidaysRepo, UpdateHolidayPatch } from '../../../application/ports';
import { HOLIDAYS_REPO } from '../../../infra/infra.module';

@Injectable()
export class AdminHolidaysService {
  constructor(
    @Inject(HOLIDAYS_REPO)
    private readonly holidaysRepo: HolidaysRepo,
  ) {}

  async list(from: Date, to: Date, branchId?: string | null) {
    return this.holidaysRepo.list(from, to, branchId ?? undefined);
  }

  async add(date: Date, label?: string | null, branchId?: string | null) {
    return this.holidaysRepo.add(date, label, branchId ?? undefined);
  }

  async update(id: string, patch: UpdateHolidayPatch) {
    return this.holidaysRepo.update(id, patch);
  }

  async remove(id: string) {
    return this.holidaysRepo.remove(id);
  }
}
