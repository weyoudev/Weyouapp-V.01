import { type PrismaClient } from '@prisma/client';
import type {
  SubscriptionPlansRepo,
  SubscriptionPlanRecord,
  CreateSubscriptionPlanInput,
  UpdateSubscriptionPlanPatch,
} from '../../../application/ports';

type PrismaLike = Pick<PrismaClient, 'subscriptionPlan' | 'subscriptionPlanBranch'>;

function toRecord(
  row: {
    id: string;
    name: string;
    description: string | null;
    redemptionMode: string;
    variant: string;
    validityDays: number;
    maxPickups: number;
    kgLimit: unknown;
    itemsLimit: number | null;
    minKgPerPickup: unknown;
    pricePaise: number;
    applicableServiceTypes: string[];
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
  },
  branchIds: string[],
): SubscriptionPlanRecord {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? null,
    redemptionMode: row.redemptionMode as SubscriptionPlanRecord['redemptionMode'],
    variant: row.variant as SubscriptionPlanRecord['variant'],
    validityDays: row.validityDays,
    maxPickups: row.maxPickups,
    kgLimit: row.kgLimit != null ? Number(row.kgLimit) : null,
    itemsLimit: row.itemsLimit,
    minKgPerPickup: row.minKgPerPickup != null ? Number(row.minKgPerPickup) : null,
    pricePaise: row.pricePaise,
    applicableServiceTypes: row.applicableServiceTypes,
    active: row.active,
    branchIds,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class PrismaSubscriptionPlansRepo implements SubscriptionPlansRepo {
  constructor(private readonly prisma: PrismaLike) {}

  async create(input: CreateSubscriptionPlanInput): Promise<SubscriptionPlanRecord> {
    const branchIds = input.branchIds ?? [];
    const row = await this.prisma.subscriptionPlan.create({
      data: {
        name: input.name,
        description: input.description ?? undefined,
        redemptionMode: input.redemptionMode ?? 'MULTI_USE',
        variant: input.variant,
        validityDays: input.validityDays,
        maxPickups: input.maxPickups,
        kgLimit: input.kgLimit ?? undefined,
        itemsLimit: input.itemsLimit ?? undefined,
        minKgPerPickup: input.minKgPerPickup ?? undefined,
        pricePaise: input.pricePaise,
        applicableServiceTypes: input.applicableServiceTypes ?? [],
        active: input.active ?? true,
        ...(branchIds.length > 0 && {
          planBranches: {
            create: branchIds.map((branchId) => ({ branchId })),
          },
        }),
      },
      include: { planBranches: true },
    });
    const ids = row.planBranches.map((pb) => pb.branchId);
    return toRecord(row, ids);
  }

  async update(id: string, patch: UpdateSubscriptionPlanPatch): Promise<SubscriptionPlanRecord> {
    if (patch.branchIds !== undefined) {
      await this.prisma.subscriptionPlanBranch.deleteMany({ where: { planId: id } });
      if (patch.branchIds.length > 0) {
        await this.prisma.subscriptionPlanBranch.createMany({
          data: patch.branchIds.map((branchId) => ({ planId: id, branchId })),
        });
      }
    }
    const row = await this.prisma.subscriptionPlan.update({
      where: { id },
      data: {
        ...(patch.name !== undefined && { name: patch.name }),
        ...(patch.description !== undefined && { description: patch.description }),
        ...(patch.redemptionMode !== undefined && { redemptionMode: patch.redemptionMode }),
        ...(patch.variant !== undefined && { variant: patch.variant }),
        ...(patch.validityDays !== undefined && { validityDays: patch.validityDays }),
        ...(patch.maxPickups !== undefined && { maxPickups: patch.maxPickups }),
        ...(patch.kgLimit !== undefined && { kgLimit: patch.kgLimit }),
        ...(patch.itemsLimit !== undefined && { itemsLimit: patch.itemsLimit }),
        ...(patch.minKgPerPickup !== undefined && { minKgPerPickup: patch.minKgPerPickup }),
        ...(patch.pricePaise !== undefined && { pricePaise: patch.pricePaise }),
        ...(patch.applicableServiceTypes !== undefined && { applicableServiceTypes: patch.applicableServiceTypes }),
        ...(patch.active !== undefined && { active: patch.active }),
      },
      include: { planBranches: true },
    });
    const branchIds = row.planBranches.map((pb) => pb.branchId);
    return toRecord(row, branchIds);
  }

  async getById(id: string): Promise<SubscriptionPlanRecord | null> {
    const row = await this.prisma.subscriptionPlan.findUnique({
      where: { id },
      include: { planBranches: true },
    });
    if (!row) return null;
    const branchIds = row.planBranches.map((pb) => pb.branchId);
    return toRecord(row, branchIds);
  }

  async listAll(): Promise<SubscriptionPlanRecord[]> {
    const rows = await this.prisma.subscriptionPlan.findMany({
      orderBy: { name: 'asc' },
      include: { planBranches: true },
    });
    return rows.map((row) => toRecord(row, row.planBranches.map((pb) => pb.branchId)));
  }

  async listActive(): Promise<SubscriptionPlanRecord[]> {
    const rows = await this.prisma.subscriptionPlan.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
      include: { planBranches: true },
    });
    return rows.map((row) => toRecord(row, row.planBranches.map((pb) => pb.branchId)));
  }
}
