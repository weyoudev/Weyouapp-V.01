import { AppError } from '../errors';
import type { BrandingRepo, BrandingSettingsRecord } from '../ports';

export interface GetBrandingDeps {
  brandingRepo: BrandingRepo;
}

export async function getBranding(deps: GetBrandingDeps): Promise<BrandingSettingsRecord> {
  const branding = await deps.brandingRepo.get();
  if (!branding) {
    throw new AppError('BRANDING_NOT_FOUND', 'Branding settings not found');
  }
  return branding;
}
