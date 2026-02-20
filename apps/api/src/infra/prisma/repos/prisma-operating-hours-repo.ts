import type { PrismaClient } from '@prisma/client';
import type { OperatingHoursRecord, OperatingHoursRepo } from '../../../application/ports';

type PrismaLike = Pick<PrismaClient, 'operatingHours'>;

export class PrismaOperatingHoursRepo implements OperatingHoursRepo {
  constructor(private readonly prisma: PrismaLike) {}

  async get(branchId?: string | null): Promise<OperatingHoursRecord | null> {
    const bid = branchId ?? null;
    const row = await this.prisma.operatingHours.findFirst({
      where: { branchId: bid },
    });
    if (!row) return null;
    return {
      id: row.id,
      branchId: row.branchId,
      startTime: row.startTime,
      endTime: row.endTime,
    };
  }

  async set(branchId: string | null, startTime: string, endTime: string): Promise<OperatingHoursRecord> {
    // Prisma's findUnique/upsert with where: { branchId: null } is unreliable (nullable unique);
    // use findFirst + update or create instead.
    const existing = await this.prisma.operatingHours.findFirst({
      where: { branchId },
    });
    const row = existing
      ? await this.prisma.operatingHours.update({
          where: { id: existing.id },
          data: { startTime, endTime },
        })
      : await this.prisma.operatingHours.create({
          data: { branchId, startTime, endTime },
        });
    return {
      id: row.id,
      branchId: row.branchId,
      startTime: row.startTime,
      endTime: row.endTime,
    };
  }
}
