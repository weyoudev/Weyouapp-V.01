import { Controller, Get, Param, Res, Header } from '@nestjs/common';
import { Response } from 'express';
import { AssetsService } from './assets.service';

/** Carousel images for mobile app. Public. */
@Controller('assets/carousel')
export class AssetsCarouselController {
  constructor(private readonly assetsService: AssetsService) {}

  @Get(':fileName')
  @Header('Cache-Control', 'public, max-age=3600')
  async getCarouselAsset(
    @Param('fileName') fileName: string,
    @Res({ passthrough: false }) res: Response,
  ) {
    const { stream, contentType } = await this.assetsService.getCarouselStream(fileName);
    res.setHeader('Content-Type', contentType);
    stream.pipe(res);
  }
}
