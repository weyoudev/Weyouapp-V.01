import { type PrismaClient } from '@prisma/client';
import type { ServiceCategoryRepo, ServiceCategoryRecord } from '../../../application/ports';

type PrismaLike = Pick<PrismaClient, 'serviceCategory'>;

function toRecord(row: {
  id: string;
  code: string;
  label: string;
  isActive: boolean;
  createdAt: Date;
}): ServiceCategoryRecord {
  return {
    id: row.id,
    code: row.code,
    label: row.label,
    isActive: row.isActive,
    createdAt: row.createdAt,
  };
}

export class PrismaServiceCategoryRepo implements ServiceCategoryRepo {
  constructor(private readonly prisma: PrismaLike) {}

  async create(code: string, label: string, isActive = true): Promise<ServiceCategoryRecord> {
    const row = await this.prisma.serviceCategory.create({
      data: { code, label, isActive },
    });
    return toRecord(row);
  }

  async getById(id: string): Promise<ServiceCategoryRecord | null> {
    const row = await this.prisma.serviceCategory.findUnique({
      where: { id },
    });
    return row ? toRecord(row) : null;
  }

  async getByCode(code: string): Promise<ServiceCategoryRecord | null> {
    const row = await this.prisma.serviceCategory.findUnique({
      where: { code },
    });
    return row ? toRecord(row) : null;
  }

  async update(id: string, patch: { label?: string; isActive?: boolean }): Promise<ServiceCategoryRecord> {
    const row = await this.prisma.serviceCategory.update({
      where: { id },
      data: patch,
    });
    return toRecord(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.serviceCategory.delete({ where: { id } });
  }

  async listAll(): Promise<ServiceCategoryRecord[]> {
    const rows = await this.prisma.serviceCategory.findMany({
      orderBy: { code: 'asc' },
    });
    return rows.map(toRecord);
  }

  async listActive(): Promise<ServiceCategoryRecord[]> {
    const rows = await this.prisma.serviceCategory.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' },
    });
    return rows.map(toRecord);
  }
}
