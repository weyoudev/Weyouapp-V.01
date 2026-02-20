import { Module } from '@nestjs/common';
import { InvoicesController } from './invoices.controller';
import { InvoicePdfController } from './invoice-pdf.controller';
import { InvoicesService } from './invoices.service';
import { InvoicePdfService } from './invoice-pdf.service';

@Module({
  controllers: [InvoicesController, InvoicePdfController],
  providers: [InvoicesService, InvoicePdfService],
})
export class InvoicesModule {}

