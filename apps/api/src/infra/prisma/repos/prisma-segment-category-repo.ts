import { type PrismaClient } from '@prisma/client';
import type { SegmentCategoryRepo, SegmentCategoryRecord } from '../../../application/ports';

type PrismaLike = Pick<PrismaClient, 'segmentCategory'>;

function toRecord(row: {
  id: string;
  code: string;
  label: string;
  isActive: boolean;
  createdAt: Date;
}): SegmentCategoryRecord {
  return {
    id: row.id,
    code: row.code,
    label: row.label,
    isActive: row.isActive,
    createdAt: row.createdAt,
  };
}

export class PrismaSegmentCategoryRepo implements SegmentCategoryRepo {
  constructor(private readonly prisma: PrismaLike) {}

  async create(code: string, label: string, isActive = true): Promise<SegmentCategoryRecord> {
    const row = await this.prisma.segmentCategory.create({
      data: { code, label, isActive },
    });
    return toRecord(row);
  }

  async getById(id: string): Promise<SegmentCategoryRecord | null> {
    const row = await this.prisma.segmentCategory.findUnique({
      where: { id },
    });
    return row ? toRecord(row) : null;
  }

  async getByCode(code: string): Promise<SegmentCategoryRecord | null> {
    const row = await this.prisma.segmentCategory.findUnique({
      where: { code },
    });
    return row ? toRecord(row) : null;
  }

  async update(id: string, patch: { label?: string; isActive?: boolean }): Promise<SegmentCategoryRecord> {
    const row = await this.prisma.segmentCategory.update({
      where: { id },
      data: patch,
    });
    return toRecord(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.segmentCategory.delete({ where: { id } });
  }

  async listAll(): Promise<SegmentCategoryRecord[]> {
    const rows = await this.prisma.segmentCategory.findMany({
      orderBy: { code: 'asc' },
    });
    return rows.map(toRecord);
  }

  async listActive(): Promise<SegmentCategoryRecord[]> {
    const rows = await this.prisma.segmentCategory.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' },
    });
    return rows.map(toRecord);
  }
}
