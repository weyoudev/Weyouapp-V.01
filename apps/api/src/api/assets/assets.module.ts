import { Module } from '@nestjs/common';
import { AssetsController } from './assets.controller';
import { AssetsCarouselController } from './assets-carousel.controller';
import { AssetsService } from './assets.service';

@Module({
  controllers: [AssetsController, AssetsCarouselController],
  providers: [AssetsService],
})
export class AssetsModule {}
