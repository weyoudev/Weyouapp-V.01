import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Role } from '@shared/enums';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { Roles } from '../../common/roles.decorator';
import { RolesGuard } from '../../common/roles.guard';
import { AdminBranchesService } from '../services/admin-branches.service';
import { CreateBranchDto } from '../dto/create-branch.dto';
import { UpdateBranchDto } from '../dto/update-branch.dto';

interface MulterUploadFile {
  buffer?: Buffer;
  originalname?: string;
}

@Controller('admin/branches')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.BILLING, Role.OPS)
export class AdminBranchesController {
  constructor(private readonly adminBranchesService: AdminBranchesService) {}

  @Get()
  @Roles(Role.ADMIN, Role.BILLING, Role.OPS)
  async list() {
    return this.adminBranchesService.list();
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.BILLING, Role.OPS)
  async getById(@Param('id') id: string) {
    return this.adminBranchesService.getById(id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.BILLING)
  async create(@Body() dto: CreateBranchDto) {
    return this.adminBranchesService.create({
      name: dto.name,
      address: dto.address,
      phone: dto.phone ?? null,
      email: dto.email ?? null,
      gstNumber: dto.gstNumber ?? null,
      panNumber: dto.panNumber ?? null,
      footerNote: dto.footerNote ?? null,
      upiId: dto.upiId ?? null,
      upiPayeeName: dto.upiPayeeName ?? null,
      upiLink: dto.upiLink ?? null,
      isDefault: dto.isDefault,
    });
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.BILLING)
  async update(@Param('id') id: string, @Body() dto: UpdateBranchDto) {
    return this.adminBranchesService.update(id, {
      name: dto.name,
      address: dto.address,
      phone: dto.phone,
      email: dto.email,
      gstNumber: dto.gstNumber,
      panNumber: dto.panNumber,
      footerNote: dto.footerNote,
      upiId: dto.upiId,
      upiPayeeName: dto.upiPayeeName,
      upiLink: dto.upiLink,
      isDefault: dto.isDefault,
    });
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.BILLING)
  async delete(@Param('id') id: string) {
    await this.adminBranchesService.delete(id);
    return { success: true };
  }

  @Post(':id/logo')
  @Roles(Role.ADMIN, Role.BILLING)
  @UseInterceptors(FileInterceptor('file'))
  async uploadLogo(
    @Param('id') id: string,
    @UploadedFile() file: MulterUploadFile,
  ) {
    if (!file?.buffer) {
      throw new BadRequestException('File is required');
    }
    return this.adminBranchesService.uploadLogo(
      id,
      file.buffer,
      file.originalname ?? 'logo',
    );
  }

  @Post(':id/upi-qr')
  @Roles(Role.ADMIN, Role.BILLING)
  @UseInterceptors(FileInterceptor('file'))
  async uploadUpiQr(
    @Param('id') id: string,
    @UploadedFile() file: MulterUploadFile,
  ) {
    if (!file?.buffer) {
      throw new BadRequestException('File is required');
    }
    return this.adminBranchesService.uploadUpiQr(
      id,
      file.buffer,
      file.originalname ?? 'upi-qr',
    );
  }
}
