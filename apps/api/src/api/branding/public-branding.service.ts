import { Inject, Injectable } from '@nestjs/common';
import type { BrandingRepo } from '../../application/ports';
import { BRANDING_REPO } from '../../infra/infra.module';

export interface PublicBrandingResponse {
  businessName: string | null;
  logoUrl: string | null;
  /** Mobile app terms and conditions (for login acceptance). */
  termsAndConditions: string | null;
  /** Mobile app privacy policy (for login acceptance). */
  privacyPolicy: string | null;
  /** Welcome screen background image (displayed at 50% opacity). */
  welcomeBackgroundUrl: string | null;
}

@Injectable()
export class PublicBrandingService {
  constructor(
    @Inject(BRANDING_REPO)
    private readonly brandingRepo: BrandingRepo,
  ) {}

  async getPublic(): Promise<PublicBrandingResponse> {
    const branding = await this.brandingRepo.get();
    const updatedAt = branding?.updatedAt?.getTime();
    const logoUrl = branding?.logoUrl ?? null;
    const welcomeBackgroundUrl = branding?.welcomeBackgroundUrl ?? null;
    return {
      businessName: branding?.businessName ?? null,
      logoUrl: logoUrl && updatedAt != null ? `${logoUrl}${logoUrl.includes('?') ? '&' : '?'}v=${updatedAt}` : logoUrl,
      termsAndConditions: branding?.termsAndConditions ?? null,
      privacyPolicy: branding?.privacyPolicy ?? null,
      welcomeBackgroundUrl: welcomeBackgroundUrl && updatedAt != null ? `${welcomeBackgroundUrl}${welcomeBackgroundUrl.includes('?') ? '&' : '?'}v=${updatedAt}` : welcomeBackgroundUrl,
    };
  }
}
