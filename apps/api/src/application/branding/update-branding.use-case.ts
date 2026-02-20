import type { BrandingRepo, BrandingSettingsRecord, BrandingUpsertData } from '../ports';

export interface UpdateBrandingDeps {
  brandingRepo: BrandingRepo;
}

export async function updateBranding(
  data: BrandingUpsertData,
  deps: UpdateBrandingDeps,
): Promise<BrandingSettingsRecord> {
  return deps.brandingRepo.upsert(data);
}
