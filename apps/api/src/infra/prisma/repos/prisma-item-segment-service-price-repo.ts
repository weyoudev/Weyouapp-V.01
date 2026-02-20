import { type PrismaClient } from '@prisma/client';
import type {
  ItemSegmentServicePriceRepo,
  ItemSegmentServicePriceRecord,
} from '../../../application/ports';

type PrismaLike = Pick<PrismaClient, 'itemSegmentServicePrice'>;

function toRecord(row: {
  id: string;
  itemId: string;
  segmentCategoryId: string;
  serviceCategoryId: string;
  priceRupees: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): ItemSegmentServicePriceRecord {
  return {
    id: row.id,
    itemId: row.itemId,
    segmentCategoryId: row.segmentCategoryId,
    serviceCategoryId: row.serviceCategoryId,
    priceRupees: row.priceRupees,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class PrismaItemSegmentServicePriceRepo implements ItemSegmentServicePriceRepo {
  constructor(private readonly prisma: PrismaLike) {}

  async listByItemId(itemId: string): Promise<ItemSegmentServicePriceRecord[]> {
    const rows = await this.prisma.itemSegmentServicePrice.findMany({
      where: { itemId },
    });
    return rows.map(toRecord);
  }

  async replaceForItem(
    itemId: string,
    rows: Array<{
      segmentCategoryId: string;
      serviceCategoryId: string;
      priceRupees: number;
      isActive: boolean;
    }>,
  ): Promise<ItemSegmentServicePriceRecord[]> {
    await this.prisma.itemSegmentServicePrice.deleteMany({ where: { itemId } });
    const results: ItemSegmentServicePriceRecord[] = [];
    for (const r of rows) {
      const row = await this.prisma.itemSegmentServicePrice.create({
        data: {
          itemId,
          segmentCategoryId: r.segmentCategoryId,
          serviceCategoryId: r.serviceCategoryId,
          priceRupees: r.priceRupees,
          isActive: r.isActive,
        },
      });
      results.push(toRecord(row));
    }
    return results;
  }

  async upsert(
    itemId: string,
    segmentCategoryId: string,
    serviceCategoryId: string,
    priceRupees: number,
    isActive: boolean,
  ): Promise<ItemSegmentServicePriceRecord> {
    const row = await this.prisma.itemSegmentServicePrice.upsert({
      where: {
        itemId_segmentCategoryId_serviceCategoryId: {
          itemId,
          segmentCategoryId,
          serviceCategoryId,
        },
      },
      create: {
        itemId,
        segmentCategoryId,
        serviceCategoryId,
        priceRupees,
        isActive,
      },
      update: { priceRupees, isActive },
    });
    return toRecord(row);
  }
}
