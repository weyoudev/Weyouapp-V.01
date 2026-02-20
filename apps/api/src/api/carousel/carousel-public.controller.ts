import { Controller, Get } from '@nestjs/common';
import { CarouselPublicService } from './carousel-public.service';

/** Public carousel images for mobile app home. No auth. */
@Controller('carousel')
export class CarouselPublicController {
  constructor(private readonly carouselPublicService: CarouselPublicService) {}

  @Get('public')
  async getPublic() {
    return this.carouselPublicService.getPublic();
  }
}
