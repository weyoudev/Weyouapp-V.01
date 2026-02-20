import { Module } from '@nestjs/common';
import { CarouselPublicController } from './carousel-public.controller';
import { CarouselPublicService } from './carousel-public.service';

@Module({
  controllers: [CarouselPublicController],
  providers: [CarouselPublicService],
})
export class CarouselModule {}
