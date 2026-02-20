import { Controller, Get, UseGuards } from '@nestjs/common';
import { Role } from '@shared/enums';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { SubscriptionPlansService } from './subscription-plans.service';

@Controller('subscription-plans')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.CUSTOMER)
export class SubscriptionPlansController {
  constructor(private readonly subscriptionPlansService: SubscriptionPlansService) {}

  @Get()
  async list() {
    return this.subscriptionPlansService.listActive();
  }
}
