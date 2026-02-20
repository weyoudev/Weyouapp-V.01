import { BadRequestException, Controller, Get, Put, Body, Query, UseGuards, Req } from '@nestjs/common';
import { Role } from '@shared/enums';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { Roles } from '../../common/roles.decorator';
import { RolesGuard } from '../../common/roles.guard';
import type { AuthUser } from '../../common/roles.guard';
import { AdminOperatingHoursService } from '../services/admin-operating-hours.service';
import { SetOperatingHoursDto } from '../dto/set-operating-hours.dto';

@Controller('admin/operating-hours')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.OPS)
export class AdminOperatingHoursController {
  constructor(private readonly adminOperatingHoursService: AdminOperatingHoursService) {}

  @Get()
  async get(@Query('branchId') branchId?: string, @Req() req?: { user: AuthUser }) {
    const user = req?.user as AuthUser | undefined;
    const effectiveBranchId = user?.role === Role.OPS && user?.branchId ? user.branchId : branchId;
    if (!effectiveBranchId || effectiveBranchId.trim() === '') {
      throw new BadRequestException('branchId is required');
    }
    return this.adminOperatingHoursService.get(effectiveBranchId);
  }

  @Put()
  @Roles(Role.ADMIN)
  async set(@Body() dto: SetOperatingHoursDto) {
    if (!dto.branchId || dto.branchId.trim() === '') {
      throw new BadRequestException('branchId is required');
    }
    return this.adminOperatingHoursService.set(dto.branchId, dto.startTime, dto.endTime);
  }
}
