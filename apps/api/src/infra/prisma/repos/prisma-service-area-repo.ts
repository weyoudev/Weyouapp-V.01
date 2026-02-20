import type { PrismaClient } from '@prisma/client';
import { AppError } from '../../../application/errors';
import type { ServiceAreaRepo, ServiceAreaRecord, UpdateServiceAreaPatch } from '../../../application/ports';

type PrismaLike = Pick<PrismaClient, 'serviceArea'>;

function toRecord(row: { id: string; pincode: string; branchId: string; active: boolean; createdAt: Date; updatedAt: Date }): ServiceAreaRecord {
  return {
    id: row.id,
    pincode: row.pincode,
    branchId: row.branchId,
    active: row.active,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class PrismaServiceAreaRepo implements ServiceAreaRepo {
  constructor(private readonly prisma: PrismaLike) {}

  async isServiceable(pincode: string): Promise<boolean> {
    const row = await this.prisma.serviceArea.findUnique({
      where: { pincode },
    });
    return !!row && row.active;
  }

  async listAll(): Promise<ServiceAreaRecord[]> {
    const rows = await this.prisma.serviceArea.findMany({
      orderBy: { pincode: 'asc' },
    });
    return rows.map(toRecord);
  }

  async listByBranchId(branchId: string): Promise<ServiceAreaRecord[]> {
    const rows = await this.prisma.serviceArea.findMany({
      where: { branchId },
      orderBy: { pincode: 'asc' },
    });
    return rows.map(toRecord);
  }

  async getByPincode(pincode: string): Promise<ServiceAreaRecord | null> {
    const row = await this.prisma.serviceArea.findUnique({
      where: { pincode },
    });
    return row ? toRecord(row) : null;
  }

  async upsert(pincode: string, branchId: string, active: boolean): Promise<ServiceAreaRecord> {
    const existing = await this.prisma.serviceArea.findUnique({
      where: { pincode },
    });
    if (existing && existing.branchId !== branchId) {
      throw new AppError('PINCODE_ALREADY_IN_OTHER_BRANCH', 'This pincode is already added to another branch.', { pincode });
    }
    const row = await this.prisma.serviceArea.upsert({
      where: { pincode },
      create: { pincode, branchId, active },
      update: { active },
    });
    return toRecord(row);
  }

  async setActive(pincode: string, active: boolean): Promise<ServiceAreaRecord> {
    const row = await this.prisma.serviceArea.update({
      where: { pincode },
      data: { active },
    });
    return toRecord(row);
  }

  async update(pincode: string, patch: UpdateServiceAreaPatch): Promise<ServiceAreaRecord> {
    const data: { branchId?: string; active?: boolean } = {};
    if (patch.branchId !== undefined) data.branchId = patch.branchId;
    if (patch.active !== undefined) data.active = patch.active;
    if (Object.keys(data).length === 0) {
      const row = await this.prisma.serviceArea.findUnique({ where: { pincode } });
      if (!row) throw new AppError('NOT_FOUND', 'Service area not found', { pincode });
      return toRecord(row);
    }
    const row = await this.prisma.serviceArea.update({
      where: { pincode },
      data,
    });
    return toRecord(row);
  }

  async remove(pincode: string): Promise<void> {
    await this.prisma.serviceArea.delete({ where: { pincode } });
  }
}

