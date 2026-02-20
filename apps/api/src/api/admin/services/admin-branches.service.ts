import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { BranchRepo, StorageAdapter } from '../../../application/ports';
import { BRANCH_REPO, STORAGE_ADAPTER } from '../../../infra/infra.module';

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
export class AdminBranchesService {
  constructor(
    @Inject(BRANCH_REPO) private readonly branchRepo: BranchRepo,
    @Inject(STORAGE_ADAPTER) private readonly storageAdapter: StorageAdapter,
  ) {}

  async list() {
    return this.branchRepo.listAll();
  }

  async getById(id: string) {
    const branch = await this.branchRepo.getById(id);
    if (!branch) throw new NotFoundException('Branch not found');
    return branch;
  }

  async create(data: Parameters<BranchRepo['create']>[0]) {
    const branch = await this.branchRepo.create(data);
    if (data.isDefault === true) {
      await this.branchRepo.clearOtherDefaults(branch.id);
      return this.branchRepo.getById(branch.id) ?? branch;
    }
    return branch;
  }

  async update(id: string, data: Parameters<BranchRepo['update']>[1]) {
    await this.getById(id);
    if (data.isDefault === true) {
      await this.branchRepo.clearOtherDefaults(id);
    }
    return this.branchRepo.update(id, data);
  }

  async delete(id: string) {
    await this.getById(id);
    return this.branchRepo.delete(id);
  }

  async uploadLogo(branchId: string, buffer: Buffer, originalName: string) {
    await this.getById(branchId);
    const safeName = sanitizeOriginalName(originalName);
    const fileName = `branch-${branchId}-${Date.now()}-${safeName}`;
    const pathKey = `branding/branches/${fileName}`;
    const contentType = contentTypeFromExt(originalName);
    await this.storageAdapter.putObject(pathKey, buffer, contentType);
    const url = `/api/assets/branding/branches/${fileName}`;
    await this.branchRepo.setLogoUrl(branchId, url);
    return this.getById(branchId);
  }

  async uploadUpiQr(branchId: string, buffer: Buffer, originalName: string) {
    await this.getById(branchId);
    const safeName = sanitizeOriginalName(originalName);
    const fileName = `branch-${branchId}-qr-${Date.now()}-${safeName}`;
    const pathKey = `branding/branches/${fileName}`;
    const contentType = contentTypeFromExt(originalName);
    await this.storageAdapter.putObject(pathKey, buffer, contentType);
    const url = `/api/assets/branding/branches/${fileName}`;
    await this.branchRepo.setUpiQrUrl(branchId, url);
    return this.getById(branchId);
  }
}
