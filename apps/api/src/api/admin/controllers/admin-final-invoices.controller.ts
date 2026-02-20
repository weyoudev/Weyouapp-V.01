import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { Role } from '@shared/enums';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { Roles } from '../../common/roles.decorator';
import { RolesGuard } from '../../common/roles.guard';
import type { AuthUser } from '../../common/roles.guard';
import { AdminFinalInvoicesService } from '../services/admin-final-invoices.service';

@Controller('admin/final-invoices')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.OPS, Role.BILLING)
export class AdminFinalInvoicesController {
  constructor(private readonly adminFinalInvoicesService: AdminFinalInvoicesService) {}

  @Get()
  async list(
    @Query('customerId') customerId?: string,
    @Query('branchId') branchIdQuery?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
    @Req() req?: { user: AuthUser },
  ) {
    const user = req?.user as AuthUser | undefined;
    const branchId =
      user?.role === Role.OPS && user?.branchId ? user.branchId : (branchIdQuery ?? undefined);
    return this.adminFinalInvoicesService.listFinalInvoices({
      customerId,
      branchId: branchId ?? null,
      dateFrom,
      dateTo,
      limit: limit ? parseInt(limit, 10) : undefined,
      cursor,
    });
  }
}
