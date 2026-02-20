import { Controller, Get, Patch, Param, Query, Body, UseGuards } from '@nestjs/common';
import { Role } from '@shared/enums';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { Roles } from '../../common/roles.decorator';
import { RolesGuard } from '../../common/roles.guard';
import { AdminSubscriptionsService } from '../services/admin-subscriptions.service';
import { UpdatePaymentDto } from '../dto/update-payment.dto';

@Controller('admin/subscriptions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.OPS, Role.BILLING)
export class AdminSubscriptionsController {
  constructor(private readonly adminSubscriptionsService: AdminSubscriptionsService) {}

  @Get('invoices')
  async listSubscriptionInvoices(
    @Query('customerId') customerId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.adminSubscriptionsService.listSubscriptionInvoices({
      customerId,
      dateFrom,
      dateTo,
      limit: limit ? parseInt(limit, 10) : undefined,
      cursor,
    });
  }

  @Get(':id/detail')
  async getSubscriptionDetail(@Param('id') subscriptionId: string) {
    return this.adminSubscriptionsService.getSubscriptionDetail(subscriptionId);
  }

  @Get(':id/invoice')
  async getSubscriptionInvoice(@Param('id') subscriptionId: string) {
    return this.adminSubscriptionsService.getSubscriptionInvoice(subscriptionId);
  }

  @Patch(':id/payment')
  async confirmSubscriptionPayment(@Param('id') subscriptionId: string, @Body() dto: UpdatePaymentDto) {
    return this.adminSubscriptionsService.confirmSubscriptionPayment(subscriptionId, {
      provider: dto.provider,
      status: dto.status,
      amountPaise: dto.amountPaise,
    });
  }
}
