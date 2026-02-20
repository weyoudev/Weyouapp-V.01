import {
  Controller,
  Get,
  Post,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Param,
  Query,
  BadRequestException,
  ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Role } from '@shared/enums';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { Roles } from '../../common/roles.decorator';
import { RolesGuard } from '../../common/roles.guard';
import { AdminCarouselService } from '../services/admin-carousel.service';

interface MulterUploadFile {
  buffer?: Buffer;
  originalname?: string;
}

@Controller('admin/carousel')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.BILLING, Role.OPS)
export class AdminCarouselController {
  constructor(private readonly adminCarouselService: AdminCarouselService) {}

  @Get()
  async list() {
    return this.adminCarouselService.list();
  }

  @Post('upload')
  @Roles(Role.ADMIN, Role.BILLING)
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: MulterUploadFile,
    @Query('position', new ParseIntPipe({ min: 1, max: 3 })) position: number,
  ) {
    if (!file?.buffer) {
      throw new BadRequestException('File is required');
    }
    return this.adminCarouselService.upload(
      file.buffer,
      file.originalname ?? 'image',
      position,
    );
  }

  @Delete(':position')
  @Roles(Role.ADMIN, Role.BILLING)
  async remove(
    @Param('position', new ParseIntPipe({ min: 1, max: 3 })) position: number,
  ) {
    return this.adminCarouselService.remove(position);
  }
}
