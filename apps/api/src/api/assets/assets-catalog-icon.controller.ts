import { Controller, Get, Param, Res, Header } from '@nestjs/common';
import { Response } from 'express';
import { AssetsService } from './assets.service';

/** Catalog item custom icons (uploaded PNG/JPG). Public. */
@Controller('assets/catalog-icons')
export class AssetsCatalogIconController {
  constructor(private readonly assetsService: AssetsService) {}

  @Get(':fileName')
  @Header('Cache-Control', 'public, max-age=3600')
  async getCatalogIcon(
    @Param('fileName') fileName: string,
    @Res({ passthrough: false }) res: Response,
  ) {
    const { stream, contentType } = await this.assetsService.getCatalogIconStream(fileName);
    res.setHeader('Content-Type', contentType);
    stream.pipe(res);
  }
}
