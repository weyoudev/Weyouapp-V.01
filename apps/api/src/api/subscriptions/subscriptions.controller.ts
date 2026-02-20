import { Controller, Get, Post, Body, Param, UseGuards, NotFoundException } from '@nestjs/common';
import { Role } from '@shared/enums';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { CurrentUser } from '../common/current-user.decorator';
import type { AuthUser } from '../common/roles.guard';
import { SubscriptionsService } from './subscriptions.service';
import { PurchaseSubscriptionDto } from './dto/purchase-subscription.dto';

@Controller('subscriptions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.CUSTOMER)
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('plans/available')
  async getAvailablePlans(@CurrentUser() user: AuthUser) {
    return this.subscriptionsService.getAvailablePlans(user.id);
  }

  @Get(':id/invoice')
  async getSubscriptionInvoice(@CurrentUser() user: AuthUser, @Param('id') subscriptionId: string) {
    const invoice = await this.subscriptionsService.getSubscriptionInvoiceForCustomer(user.id, subscriptionId);
    if (!invoice) throw new NotFoundException('Subscription or invoice not found');
    return invoice;
  }

  @Get(':id')
  async getSubscriptionDetail(@CurrentUser() user: AuthUser, @Param('id') subscriptionId: string) {
    const detail = await this.subscriptionsService.getSubscriptionDetailForCustomer(user.id, subscriptionId);
    if (!detail) throw new NotFoundException('Subscription not found');
    return detail;
  }

  @Post()
  async purchase(@CurrentUser() user: AuthUser, @Body() dto: PurchaseSubscriptionDto) {
    const result = await this.subscriptionsService.purchase(
      user.id,
      dto.planId,
      dto.addressId,
    );
    return {
      subscriptionId: result.subscriptionId,
      planName: result.planName,
      validityStartDate: result.validityStartDate,
      validTill: result.validTill,
      remainingPickups: result.remainingPickups,
    };
  }
}
