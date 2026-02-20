import type { PrismaClient } from '@prisma/client';
import type { LaundryItemsRepo, LaundryItemRecord } from '../../../application/ports';

type PrismaLike = Pick<PrismaClient, 'laundryItem'>;

function toRecord(row: {
  id: string;
  name: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}): LaundryItemRecord {
  return {
    id: row.id,
    name: row.name,
    active: row.active,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class PrismaLaundryItemsRepo implements LaundryItemsRepo {
  constructor(private readonly prisma: PrismaLike) {}

  async create(name: string, active: boolean): Promise<LaundryItemRecord> {
    const row = await this.prisma.laundryItem.create({
      data: { name, active },
    });
    return toRecord(row);
  }

  async update(id: string, patch: { name?: string; active?: boolean }): Promise<LaundryItemRecord> {
    const row = await this.prisma.laundryItem.update({
      where: { id },
      data: patch,
    });
    return toRecord(row);
  }

  async getById(id: string): Promise<LaundryItemRecord | null> {
    const row = await this.prisma.laundryItem.findUnique({
      where: { id },
    });
    return row ? toRecord(row) : null;
  }

  async listAll(): Promise<LaundryItemRecord[]> {
    const rows = await this.prisma.laundryItem.findMany({
      orderBy: { name: 'asc' },
    });
    return rows.map(toRecord);
  }

  async listActive(): Promise<LaundryItemRecord[]> {
    const rows = await this.prisma.laundryItem.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    });
    return rows.map(toRecord);
  }
}
