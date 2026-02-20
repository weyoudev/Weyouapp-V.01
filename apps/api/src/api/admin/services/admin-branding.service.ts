import { Inject, Injectable } from '@nestjs/common';
import { getBranding } from '../../../application/branding/get-branding.use-case';
import { updateBranding } from '../../../application/branding/update-branding.use-case';
import type { BrandingUpsertData, BrandingRepo, StorageAdapter } from '../../../application/ports';
import { BRANDING_REPO, STORAGE_ADAPTER } from '../../../infra/infra.module';

function sanitizeOriginalName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100) || 'file';
}

function contentTypeFromExt(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  const map: Record<string, string> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
  };
  return map[ext ?? ''] ?? 'application/octet-stream';
}

@Injectable()
export class AdminBrandingService {
  constructor(
    @Inject(BRANDING_REPO) private readonly brandingRepo: BrandingRepo,
    @Inject(STORAGE_ADAPTER) private readonly storageAdapter: StorageAdapter,
  ) {}

  async get() {
    return getBranding({ brandingRepo: this.brandingRepo });
  }

  async update(data: BrandingUpsertData) {
    return updateBranding(data, { brandingRepo: this.brandingRepo });
  }

  async uploadLogo(buffer: Buffer, originalName: string) {
    const safeName = sanitizeOriginalName(originalName);
    const fileName = `${Date.now()}-${safeName}`;
    const pathKey = `branding/${fileName}`;
    const contentType = contentTypeFromExt(originalName);
    await this.storageAdapter.putObject(pathKey, buffer, contentType);
    const url = `/api/assets/branding/${fileName}`;
    await this.brandingRepo.setLogoUrl(url);
    return this.get();
  }

  async uploadUpiQr(buffer: Buffer, originalName: string) {
    const safeName = sanitizeOriginalName(originalName);
    const fileName = `${Date.now()}-${safeName}`;
    const pathKey = `branding/${fileName}`;
    const contentType = contentTypeFromExt(originalName);
    await this.storageAdapter.putObject(pathKey, buffer, contentType);
    const url = `/api/assets/branding/${fileName}`;
    await this.brandingRepo.setUpiQrUrl(url);
    return this.get();
  }

  async uploadWelcomeBackground(buffer: Buffer, originalName: string) {
    const safeName = sanitizeOriginalName(originalName);
    const fileName = `welcome-bg-${Date.now()}-${safeName}`;
    const pathKey = `branding/${fileName}`;
    const contentType = contentTypeFromExt(originalName);
    await this.storageAdapter.putObject(pathKey, buffer, contentType);
    const url = `/api/assets/branding/${fileName}`;
    await this.brandingRepo.setWelcomeBackgroundUrl(url);
    return this.get();
  }
}
