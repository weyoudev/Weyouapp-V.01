import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { Role } from '@shared/enums';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { Roles } from '../../common/roles.decorator';
import { RolesGuard } from '../../common/roles.guard';
import type { AuthUser } from '../../common/roles.guard';
import { AdminServiceAreasService } from '../services/admin-service-areas.service';
import { CreateServiceAreaDto, PatchServiceAreaDto } from '../dto/service-area.dto';

@Controller('admin/service-areas')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.OPS)
export class AdminServiceAreasController {
  constructor(private readonly adminServiceAreasService: AdminServiceAreasService) {}

  @Get()
  async list(@Query('branchId') branchId?: string, @Req() req?: { user: AuthUser }) {
    const user = req?.user as AuthUser | undefined;
    const effectiveBranchId = user?.role === Role.OPS && user?.branchId ? user.branchId : branchId;
    return this.adminServiceAreasService.list(effectiveBranchId);
  }

  @Post()
  async create(@Body() dto: CreateServiceAreaDto) {
    return this.adminServiceAreasService.upsert(dto.pincode, dto.branchId, dto.active);
  }

  @Patch(':pincode')
  async update(@Param('pincode') pincode: string, @Body() dto: PatchServiceAreaDto) {
    return this.adminServiceAreasService.update(pincode, dto);
  }

  @Delete(':pincode')
  async remove(@Param('pincode') pincode: string) {
    await this.adminServiceAreasService.remove(pincode);
    return { ok: true };
  }
}
