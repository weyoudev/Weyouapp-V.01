import { Controller, Get } from '@nestjs/common';
import { PublicBrandingService } from './public-branding.service';

/** Public branding for login/welcome screens. No auth. */
@Controller('branding')
export class PublicBrandingController {
  constructor(private readonly publicBrandingService: PublicBrandingService) {}

  @Get('public')
  async getPublic() {
    return this.publicBrandingService.getPublic();
  }
}
