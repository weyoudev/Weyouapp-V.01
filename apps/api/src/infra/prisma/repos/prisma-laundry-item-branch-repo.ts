import { type PrismaClient } from '@prisma/client';
import type { LaundryItemBranchRepo } from '../../../application/ports';

type PrismaLike = Pick<PrismaClient, 'laundryItemBranch'>;

export class PrismaLaundryItemBranchRepo implements LaundryItemBranchRepo {
  constructor(private readonly prisma: PrismaLike) {}

  async getBranchIdsForItem(itemId: string): Promise<string[]> {
    const rows = await this.prisma.laundryItemBranch.findMany({
      where: { itemId },
      select: { branchId: true },
    });
    return rows.map((r) => r.branchId);
  }

  async setBranchesForItem(itemId: string, branchIds: string[]): Promise<void> {
    await this.prisma.laundryItemBranch.deleteMany({ where: { itemId } });
    if (branchIds.length > 0) {
      await this.prisma.laundryItemBranch.createMany({
        data: branchIds.map((branchId) => ({ itemId, branchId })),
        skipDuplicates: true,
      });
    }
  }
}
