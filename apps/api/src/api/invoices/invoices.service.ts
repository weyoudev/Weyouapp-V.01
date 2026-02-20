import { Inject, Injectable } from '@nestjs/common';
import { InvoiceStatus, InvoiceType } from '@shared/enums';
import { AppError } from '../../application/errors';
import { calculateInvoiceTotals } from '../../application/invoices/calculate-invoice-totals';
import { generateAndStoreInvoicePdf } from '../../application/invoices/generate-and-store-invoice-pdf.use-case';
import type { InvoicesRepo, OrdersRepo, BrandingRepo, CustomersRepo, PdfGenerator, StorageAdapter } from '../../application/ports';
import { INVOICES_REPO, ORDERS_REPO, BRANDING_REPO, CUSTOMERS_REPO, PDF_GENERATOR, STORAGE_ADAPTER } from '../../infra/infra.module';

@Injectable()
export class InvoicesService {
  constructor(
    @Inject(INVOICES_REPO) private readonly invoicesRepo: InvoicesRepo,
    @Inject(ORDERS_REPO) private readonly ordersRepo: OrdersRepo,
    @Inject(BRANDING_REPO) private readonly brandingRepo: BrandingRepo,
    @Inject(CUSTOMERS_REPO) private readonly customersRepo: CustomersRepo,
    @Inject(PDF_GENERATOR) private readonly pdfGenerator: PdfGenerator,
    @Inject(STORAGE_ADAPTER) private readonly storageAdapter: StorageAdapter,
  ) {}

  async createDraft(orderId: string, dto: {
    items: Array<{ type: string; name: string; quantity: number; unitPrice: number; amount?: number }>;
    tax?: number;
  }) {
    const order = await this.ordersRepo.getById(orderId);
    if (!order) {
      throw new AppError('ORDER_NOT_FOUND', 'Order not found', { orderId });
    }

    const totals = calculateInvoiceTotals(
      dto.items.map((i) => ({
        type: i.type as import('@shared/enums').InvoiceItemType,
        name: i.name,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        amount: i.amount,
      })),
      dto.tax ?? 0,
    );

    const branding = await this.brandingRepo.get();
    const brandingSnapshotJson = branding
      ? {
          businessName: branding.businessName,
          address: branding.address,
          phone: branding.phone,
          email: branding.email ?? null,
          footerNote: branding.footerNote,
          logoUrl: branding.logoUrl,
          upiId: branding.upiId,
          upiPayeeName: branding.upiPayeeName,
          upiQrUrl: branding.upiQrUrl,
          panNumber: branding.panNumber ?? null,
          gstNumber: branding.gstNumber ?? null,
          termsAndConditions: branding.termsAndConditions ?? null,
        }
      : undefined;

    const invoice = await this.invoicesRepo.createDraft({
      orderId,
      type: InvoiceType.FINAL,
      subtotal: totals.subtotal,
      tax: totals.tax,
      total: totals.total,
      brandingSnapshotJson,
      items: dto.items.map((i, index) => ({
        type: i.type,
        name: i.name,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        amount: totals.items[index].amount,
      })),
    });

    return {
      invoiceId: invoice.id,
      subtotal: invoice.subtotal,
      tax: invoice.tax,
      total: invoice.total,
    };
  }

  async finalize(orderId: string) {
    const invoice = await this.invoicesRepo.getByOrderIdAndType(orderId, InvoiceType.FINAL);
    if (!invoice) {
      throw new AppError('INVOICE_NOT_FOUND', 'Invoice not found for order');
    }
    const updated = await this.invoicesRepo.setIssued(invoice.id, new Date());
    return { invoiceId: updated.id, status: InvoiceStatus.ISSUED };
  }

  async generatePdf(orderId: string) {
    const invoice = await this.invoicesRepo.getByOrderId(orderId);
    if (!invoice) {
      throw new AppError('INVOICE_NOT_FOUND', 'Invoice not found for order');
    }
    if (invoice.status !== 'ISSUED' || !invoice.issuedAt) {
      throw new AppError('INVOICE_NOT_FOUND', 'Invoice must be ISSUED before generating PDF');
    }
    const { pdfUrl } = await generateAndStoreInvoicePdf(invoice.id, {
      invoicesRepo: this.invoicesRepo,
      ordersRepo: this.ordersRepo,
      customersRepo: this.customersRepo,
      brandingRepo: this.brandingRepo,
      pdfGenerator: this.pdfGenerator,
      storageAdapter: this.storageAdapter,
    });
    return { pdfUrl };
  }
}

