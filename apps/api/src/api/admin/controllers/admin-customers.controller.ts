import { Controller, Get, Patch, Param, Body, Query, Req, UseGuards } from '@nestjs/common';
import { Role } from '@shared/enums';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { Roles } from '../../common/roles.decorator';
import { RolesGuard } from '../../common/roles.guard';
import type { AuthUser } from '../../common/roles.guard';
import { AdminCustomersService } from '../services/admin-customers.service';
import { PatchCustomerDto } from '../dto/patch-customer.dto';

@Controller('admin/customers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.OPS, Role.BILLING)
export class AdminCustomersController {
  constructor(private readonly adminCustomersService: AdminCustomersService) {}

  @Get()
  async list(
    @Query('limit') limitStr?: string,
    @Query('cursor') cursor?: string,
    @Query('search') search?: string,
  ) {
    const limit = Math.min(Math.max(parseInt(limitStr ?? '20', 10) || 20, 1), 100);
    return this.adminCustomersService.listWithCounts(limit, cursor ?? null, search?.trim() || null);
  }

  @Get('search')
  async search(@Query('phone') phone: string) {
    return this.adminCustomersService.searchByPhone(phone || '');
  }

  @Get(':userId/payments')
  @Roles(Role.ADMIN, Role.OPS, Role.BILLING)
  async getPayments(
    @Param('userId') userId: string,
    @Query('branchId') branchIdQuery: string | undefined,
    @Req() req: { user: AuthUser },
  ) {
    const branchId =
      req.user.role === Role.OPS
        ? req.user.branchId ?? undefined
        : (branchIdQuery?.trim() || undefined);
    return this.adminCustomersService.getPayments(userId, branchId);
  }

  @Get(':userId/subscription-orders')
  @Roles(Role.ADMIN, Role.OPS, Role.BILLING)
  async getSubscriptionOrders(@Param('userId') userId: string, @Req() req: { user: AuthUser }) {
    const branchId = req.user.role === Role.OPS ? req.user.branchId ?? undefined : undefined;
    return this.adminCustomersService.getSubscriptionOrders(userId, branchId);
  }

  @Get(':userId')
  @Roles(Role.ADMIN, Role.OPS, Role.BILLING)
  async get(@Param('userId') userId: string, @Req() req: { user: AuthUser }) {
    const branchId = req.user.role === Role.OPS ? req.user.branchId ?? undefined : undefined;
    return this.adminCustomersService.get(userId, branchId);
  }

  @Patch(':userId')
  @Roles(Role.ADMIN)
  async update(@Param('userId') userId: string, @Body() dto: PatchCustomerDto) {
    return this.adminCustomersService.update(userId, {
      name: dto.name,
      email: dto.email,
      notes: dto.notes,
    });
  }
}
