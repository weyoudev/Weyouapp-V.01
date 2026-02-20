import { Controller, Get, UseGuards } from '@nestjs/common';
import { Role } from '@shared/enums';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { Roles } from '../../common/roles.decorator';
import { RolesGuard } from '../../common/roles.guard';
import { DbInfoService } from '../services/db-info.service';

/**
 * Admin-only system info for verifying DB connection (e.g. after DATABASE_URL change).
 */
@Controller('admin/system')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminSystemController {
  constructor(private readonly dbInfoService: DbInfoService) {}

  @Get('db-info')
  async getDbInfo() {
    return this.dbInfoService.getDbInfo();
  }
}
