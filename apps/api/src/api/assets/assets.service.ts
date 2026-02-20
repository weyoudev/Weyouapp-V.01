import { Inject, Injectable } from '@nestjs/common';
import { AppError } from '../../application/errors';
import type { StorageAdapter } from '../../application/ports';
import { STORAGE_ADAPTER } from '../../infra/infra.module';
import type { Readable } from 'stream';

/** Allow only safe filename characters (no path traversal). */
function safeFileName(fileName: string): boolean {
  return /^[a-zA-Z0-9._-]+$/.test(fileName) && !fileName.includes('..');
}

@Injectable()
export class AssetsService {
  constructor(
    @Inject(STORAGE_ADAPTER) private readonly storageAdapter: StorageAdapter,
  ) {}

  async getBrandingStream(
    fileName: string,
  ): Promise<{ stream: Readable; contentType: string }> {
    if (!safeFileName(fileName)) {
      throw new AppError('ASSET_NOT_FOUND', 'Invalid asset name');
    }
    const pathKey = `branding/${fileName}`;
    const stream = await this.storageAdapter.getObjectStream(pathKey);
    if (!stream) {
      throw new AppError('ASSET_NOT_FOUND', 'Asset not found', { fileName });
    }
    const contentType =
      'getContentTypeForPath' in this.storageAdapter
        ? (this.storageAdapter as StorageAdapter & { getContentTypeForPath(p: string): string }).getContentTypeForPath(pathKey)
        : 'application/octet-stream';
    return { stream, contentType };
  }

  /** Carousel: pathKey = carousel/:fileName */
  async getCarouselStream(
    fileName: string,
  ): Promise<{ stream: Readable; contentType: string }> {
    if (!safeFileName(fileName)) {
      throw new AppError('ASSET_NOT_FOUND', 'Invalid asset name');
    }
    const pathKey = `carousel/${fileName}`;
    const stream = await this.storageAdapter.getObjectStream(pathKey);
    if (!stream) {
      throw new AppError('ASSET_NOT_FOUND', 'Asset not found', { fileName });
    }
    const contentType =
      'getContentTypeForPath' in this.storageAdapter
        ? (this.storageAdapter as StorageAdapter & { getContentTypeForPath(p: string): string }).getContentTypeForPath(pathKey)
        : 'application/octet-stream';
    return { stream, contentType };
  }

  /** Branch logo/QR: pathKey = branding/branches/:fileName */
  async getBrandingBranchStream(
    fileName: string,
  ): Promise<{ stream: Readable; contentType: string }> {
    if (!safeFileName(fileName)) {
      throw new AppError('ASSET_NOT_FOUND', 'Invalid asset name');
    }
    const pathKey = `branding/branches/${fileName}`;
    const stream = await this.storageAdapter.getObjectStream(pathKey);
    if (!stream) {
      throw new AppError('ASSET_NOT_FOUND', 'Asset not found', { fileName });
    }
    const contentType =
      'getContentTypeForPath' in this.storageAdapter
        ? (this.storageAdapter as StorageAdapter & { getContentTypeForPath(p: string): string }).getContentTypeForPath(pathKey)
        : 'application/octet-stream';
    return { stream, contentType };
  }
}
