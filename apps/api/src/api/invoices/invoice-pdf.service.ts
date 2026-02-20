import { Inject, Injectable } from '@nestjs/common';
import { AppError } from '../../application/errors';
import type { InvoicesRepo, OrdersRepo } from '../../application/ports';
import type { StorageAdapter } from '../../application/ports';
import { INVOICES_REPO, ORDERS_REPO, STORAGE_ADAPTER } from '../../infra/infra.module';
import type { AuthUser } from '../common/roles.guard';
import type { Readable } from 'stream';

@Injectable()
export class InvoicePdfService {
  constructor(
    @Inject(INVOICES_REPO) private readonly invoicesRepo: InvoicesRepo,
    @Inject(ORDERS_REPO) private readonly ordersRepo: OrdersRepo,
    @Inject(STORAGE_ADAPTER) private readonly storageAdapter: StorageAdapter,
  ) {}

  async getStream(
    invoiceId: string,
    user: AuthUser,
  ): Promise<{ stream: Readable; contentType: string }> {
    const invoice = await this.invoicesRepo.getById(invoiceId);
    if (!invoice) {
      throw new AppError('INVOICE_NOT_FOUND', 'Invoice not found', { invoiceId });
    }

    if (user.role === 'CUSTOMER') {
      if (!invoice.orderId) {
        throw new AppError('INVOICE_ACCESS_DENIED', 'Not allowed to access this invoice');
      }
      const order = await this.ordersRepo.getById(invoice.orderId);
      if (!order || order.userId !== user.id) {
        throw new AppError('INVOICE_ACCESS_DENIED', 'Not allowed to access this invoice');
      }
    }

    const storagePath = `invoices/${invoiceId}.pdf`;
    const stream = await this.storageAdapter.getObjectStream(storagePath);
    if (!stream) {
      throw new AppError('ASSET_NOT_FOUND', 'Invoice PDF file not found', { invoiceId });
    }

    return { stream, contentType: 'application/pdf' };
  }
}
