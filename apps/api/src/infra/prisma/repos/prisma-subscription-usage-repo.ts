import type { PrismaClient } from '@prisma/client';
import { AppError } from '../../../application/errors';
import type {
  CreateSubscriptionUsageInput,
  SubscriptionUsageRecord,
  SubscriptionUsageRepo,
} from '../../../application/ports';

type PrismaLike = Pick<PrismaClient, 'subscriptionUsage'>;

const PgUniqueViolation = 'P2002';

function toUsageRecord(row: {
  id: string;
  subscriptionId: string;
  orderId: string;
  invoiceId: string | null;
  deductedPickups: number;
  deductedKg: unknown;
  deductedItemsCount: number;
  createdAt: Date;
}): SubscriptionUsageRecord {
  return {
    id: row.id,
    subscriptionId: row.subscriptionId,
    orderId: row.orderId,
    invoiceId: row.invoiceId ?? null,
    deductedPickups: row.deductedPickups,
    deductedKg: Number(row.deductedKg ?? 0),
    deductedItemsCount: row.deductedItemsCount ?? 0,
    createdAt: row.createdAt,
  };
}

function isPrismaUniqueConstraint(e: unknown): boolean {
  if (e && typeof e === 'object' && 'code' in e) {
    return (e as { code: string }).code === PgUniqueViolation;
  }
  return false;
}

export class PrismaSubscriptionUsageRepo implements SubscriptionUsageRepo {
  constructor(private readonly prisma: PrismaLike) {}

  async findByOrderId(orderId: string): Promise<SubscriptionUsageRecord | null> {
    const usage = await this.prisma.subscriptionUsage.findFirst({
      where: { orderId },
    });
    return usage ? toUsageRecord(usage) : null;
  }

  async findByOrderIdAndSubscriptionId(orderId: string, subscriptionId: string): Promise<SubscriptionUsageRecord | null> {
    const usage = await this.prisma.subscriptionUsage.findUnique({
      where: { orderId_subscriptionId: { orderId, subscriptionId } },
    });
    return usage ? toUsageRecord(usage) : null;
  }

  async findByInvoiceIdAndSubscriptionId(invoiceId: string, subscriptionId: string): Promise<SubscriptionUsageRecord | null> {
    const usage = await this.prisma.subscriptionUsage.findUnique({
      where: { invoiceId_subscriptionId: { invoiceId, subscriptionId } },
    });
    return usage ? toUsageRecord(usage) : null;
  }

  async listOrderIdsBySubscriptionId(subscriptionId: string): Promise<string[]> {
    const rows = await this.prisma.subscriptionUsage.findMany({
      where: { subscriptionId },
      select: { orderId: true },
    });
    return rows.map((r) => r.orderId);
  }

  async create(data: CreateSubscriptionUsageInput): Promise<SubscriptionUsageRecord> {
    try {
      const usage = await this.prisma.subscriptionUsage.create({
        data: {
          subscriptionId: data.subscriptionId,
          orderId: data.orderId,
          invoiceId: data.invoiceId ?? undefined,
          deductedPickups: data.deductedPickups ?? 1,
          deductedKg: data.deductedKg ?? 0,
          deductedItemsCount: data.deductedItemsCount ?? 0,
        },
      });
      return toUsageRecord(usage);
    } catch (e) {
      if (isPrismaUniqueConstraint(e)) {
        throw new AppError(
          'UNIQUE_CONSTRAINT',
          'Subscription usage already exists for this invoice and subscription',
          { orderId: data.orderId, subscriptionId: data.subscriptionId, invoiceId: data.invoiceId },
        );
      }
      throw e;
    }
  }

  async updateDeductedAmounts(orderId: string, subscriptionId: string, deductedKg: number, deductedItemsCount: number): Promise<void> {
    await this.prisma.subscriptionUsage.update({
      where: { orderId_subscriptionId: { orderId, subscriptionId } },
      data: { deductedKg, deductedItemsCount },
    });
  }
}
