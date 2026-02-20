import { Inject, Injectable } from '@nestjs/common';
import type { CarouselRepo } from '../../application/ports';
import { CAROUSEL_REPO } from '../../infra/infra.module';

@Injectable()
export class CarouselPublicService {
  constructor(
    @Inject(CAROUSEL_REPO) private readonly carouselRepo: CarouselRepo,
  ) {}

  async getPublic(): Promise<{ imageUrls: string[] }> {
    const images = await this.carouselRepo.list();
    const ordered = [null, null, null] as (string | null)[];
    for (const img of images) {
      if (img.position >= 1 && img.position <= 3) {
        ordered[img.position - 1] = img.imageUrl;
      }
    }
    const imageUrls = ordered.filter((u): u is string => u != null);
    return { imageUrls };
  }
}
