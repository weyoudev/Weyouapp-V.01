import { Module } from '@nestjs/common';
import { AssetsController } from './assets.controller';
import { AssetsCarouselController } from './assets-carousel.controller';
import { AssetsCatalogIconController } from './assets-catalog-icon.controller';
import { AssetsService } from './assets.service';

@Module({
  controllers: [AssetsController, AssetsCarouselController, AssetsCatalogIconController],
  providers: [AssetsService],
})
export class AssetsModule {}
