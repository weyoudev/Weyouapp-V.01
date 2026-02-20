import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { Role } from '@shared/enums';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { Roles } from '../../common/roles.decorator';
import { RolesGuard } from '../../common/roles.guard';
import type { AuthUser } from '../../common/roles.guard';
import { AdminHolidaysService } from '../services/admin-holidays.service';
import { AddHolidayDto } from '../dto/add-holiday.dto';
import { PatchHolidayDto } from '../dto/patch-holiday.dto';

@Controller('admin/holidays')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.OPS)
export class AdminHolidaysController {
  constructor(private readonly adminHolidaysService: AdminHolidaysService) {}

  @Get()
  async list(
    @Query('from') fromStr: string,
    @Query('to') toStr: string,
    @Query('branchId') branchId?: string,
    @Req() req?: { user: AuthUser },
  ) {
    const user = req?.user as AuthUser | undefined;
    const effectiveBranchId = user?.role === Role.OPS && user?.branchId ? user.branchId : branchId ?? null;
    const from = fromStr ? new Date(fromStr) : new Date();
    const to = toStr ? new Date(toStr) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    return this.adminHolidaysService.list(from, to, effectiveBranchId);
  }

  @Post()
  @Roles(Role.ADMIN)
  async add(@Body() dto: AddHolidayDto) {
    const date = new Date(dto.date);
    return this.adminHolidaysService.add(date, dto.label, dto.branchId ?? null);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  async update(@Param('id') id: string, @Body() dto: PatchHolidayDto) {
    const patch: { date?: Date; label?: string | null; branchId?: string | null } = {};
    if (dto.date !== undefined) patch.date = new Date(dto.date);
    if (dto.label !== undefined) patch.label = dto.label;
    if (dto.branchId !== undefined) patch.branchId = dto.branchId ?? null;
    return this.adminHolidaysService.update(id, patch);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  async remove(@Param('id') id: string) {
    await this.adminHolidaysService.remove(id);
    return { ok: true };
  }
}
