import type { PrismaClient } from '@prisma/client';
import type {
  SlotConfigRecord,
  SlotConfigRepo,
  SlotIdentifier,
} from '../../../application/ports';
import { indiaDayRange, toIndiaDateKey } from '../../../application/time/india-date';

type PrismaLike = Pick<PrismaClient, 'slotConfig' | 'order'>;

export class PrismaSlotConfigRepo implements SlotConfigRepo {
  constructor(private readonly prisma: PrismaLike) {}

  async getSlot(id: SlotIdentifier): Promise<SlotConfigRecord | null> {
    const dateKey = toIndiaDateKey(id.date);
    const { start } = indiaDayRange(dateKey);
    const row = await this.prisma.slotConfig.findFirst({
      where: {
        date: start,
        timeWindow: id.timeWindow,
        pincode: id.pincode,
      },
    });
    if (!row) return null;
    return {
      id: row.id,
      date: row.date,
      timeWindow: row.timeWindow,
      pincode: row.pincode ?? null,
      capacity: row.capacity,
    };
  }

  async countOrdersForSlot(id: SlotIdentifier): Promise<number> {
    const dateKey = toIndiaDateKey(id.date);
    const { start, end } = indiaDayRange(dateKey);
    return this.prisma.order.count({
      where: {
        pincode: id.pincode,
        timeWindow: id.timeWindow,
        pickupDate: {
          gte: start,
          lt: end,
        },
      },
    });
  }

  async createSlot(id: SlotIdentifier, capacity: number): Promise<SlotConfigRecord> {
    const dateKey = toIndiaDateKey(id.date);
    const { start } = indiaDayRange(dateKey);
    const row = await this.prisma.slotConfig.create({
      data: {
        date: start,
        timeWindow: id.timeWindow,
        pincode: id.pincode,
        capacity,
      },
    });
    return {
      id: row.id,
      date: row.date,
      timeWindow: row.timeWindow,
      pincode: row.pincode ?? null,
      capacity: row.capacity,
    };
  }
}

