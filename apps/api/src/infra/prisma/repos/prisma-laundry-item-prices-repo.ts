import { type PrismaClient } from '@prisma/client';
import type {
  LaundryItemPricesRepo,
  LaundryItemPriceRecord,
} from '../../../application/ports';
import type { ServiceType } from '@shared/enums';

type PrismaLike = Pick<PrismaClient, 'laundryItemPrice'>;

function toRecord(row: {
  id: string;
  itemId: string;
  serviceType: string;
  unitPricePaise: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}): LaundryItemPriceRecord {
  return {
    id: row.id,
    itemId: row.itemId,
    serviceType: row.serviceType as ServiceType,
    unitPricePaise: row.unitPricePaise,
    active: row.active,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class PrismaLaundryItemPricesRepo implements LaundryItemPricesRepo {
  constructor(private readonly prisma: PrismaLike) {}

  async upsertPrice(
    itemId: string,
    serviceType: ServiceType,
    unitPricePaise: number,
    active: boolean,
  ): Promise<LaundryItemPriceRecord> {
    const row = await this.prisma.laundryItemPrice.upsert({
      where: {
        itemId_serviceType: { itemId, serviceType },
      },
      create: { itemId, serviceType, unitPricePaise, active },
      update: { unitPricePaise, active },
    });
    return toRecord(row);
  }

  async listForItem(itemId: string): Promise<LaundryItemPriceRecord[]> {
    const rows = await this.prisma.laundryItemPrice.findMany({
      where: { itemId },
    });
    return rows.map(toRecord);
  }

  async listActiveForService(serviceType: ServiceType): Promise<LaundryItemPriceRecord[]> {
    const rows = await this.prisma.laundryItemPrice.findMany({
      where: { serviceType, active: true },
    });
    return rows.map(toRecord);
  }
}
