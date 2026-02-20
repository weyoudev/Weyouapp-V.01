import { Module } from '@nestjs/common';
import { PublicBrandingController } from './public-branding.controller';
import { PublicBrandingService } from './public-branding.service';

@Module({
  controllers: [PublicBrandingController],
  providers: [PublicBrandingService],
})
export class BrandingModule {}
