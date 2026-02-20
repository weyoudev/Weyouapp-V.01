import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { Role } from '@shared/enums';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { CreateInvoiceDraftDto } from './dto/create-invoice-draft.dto';
import { InvoicesService } from './invoices.service';

@Controller('orders/:id/invoice')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post('draft')
  @Roles(Role.ADMIN, Role.BILLING)
  async createDraft(
    @Param('id') orderId: string,
    @Body() dto: CreateInvoiceDraftDto,
  ) {
    return this.invoicesService.createDraft(orderId, {
      items: dto.items,
      tax: dto.tax,
    });
  }

  @Post('finalize')
  @Roles(Role.ADMIN, Role.BILLING)
  async finalize(@Param('id') orderId: string) {
    return this.invoicesService.finalize(orderId);
  }

  @Post('generate-pdf')
  @Roles(Role.ADMIN, Role.BILLING)
  async generatePdf(@Param('id') orderId: string) {
    return this.invoicesService.generatePdf(orderId);
  }
}

