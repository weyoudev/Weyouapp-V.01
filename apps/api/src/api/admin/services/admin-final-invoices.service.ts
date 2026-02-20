import { Inject, Injectable } from '@nestjs/common';
import type { InvoicesRepo } from '../../../application/ports';
import { INVOICES_REPO } from '../../../infra/infra.module';

@Injectable()
export class AdminFinalInvoicesService {
  constructor(@Inject(INVOICES_REPO) private readonly invoicesRepo: InvoicesRepo) {}

  async listFinalInvoices(filters: {
    customerId?: string;
    branchId?: string | null;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
    cursor?: string;
  }) {
    const limit = Math.min(filters.limit ?? 50, 100);
    let dateFrom: Date | undefined;
    let dateTo: Date | undefined;
    if (filters.dateFrom) dateFrom = new Date(filters.dateFrom);
    if (filters.dateTo) {
      dateTo = new Date(filters.dateTo);
      dateTo.setHours(23, 59, 59, 999);
    }
    return this.invoicesRepo.listFinalInvoices({
      customerId: filters.customerId,
      branchId: filters.branchId ?? undefined,
      dateFrom,
      dateTo,
      limit,
      cursor: filters.cursor,
    });
  }
}
