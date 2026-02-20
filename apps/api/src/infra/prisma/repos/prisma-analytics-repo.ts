import { type PrismaClient } from '@prisma/client';
import type { AnalyticsRepo, RevenueResult, RevenueBreakdownItem } from '../../../application/ports';

type PrismaLike = PrismaClient;

/**
 * Revenue in date range: billed = FINAL+ISSUED invoices, collected = CAPTURED payments.
 */
export class PrismaAnalyticsRepo implements AnalyticsRepo {
  constructor(private readonly prisma: PrismaLike) {}

  async getRevenue(
    dateFrom: Date,
    dateTo: Date,
    breakdownKind: 'daily' | 'monthly',
  ): Promise<RevenueResult> {
    const invoices = await this.prisma.invoice.findMany({
      where: {
        type: 'FINAL',
        status: 'ISSUED',
        issuedAt: { gte: dateFrom, lt: dateTo },
      },
      select: { total: true, issuedAt: true },
    });
    const payments = await this.prisma.payment.findMany({
      where: {
        status: 'CAPTURED',
        createdAt: { gte: dateFrom, lt: dateTo },
      },
      select: { amount: true, createdAt: true },
    });
    const ordersInRange = await this.prisma.order.findMany({
      where: { createdAt: { gte: dateFrom, lt: dateTo } },
      select: { id: true, createdAt: true },
    });

    const billedPaise = invoices.reduce((s, i) => s + i.total, 0);
    const collectedPaise = payments.reduce((s, p) => s + p.amount, 0);

    const keyToBilled: Record<string, number> = {};
    const keyToCollected: Record<string, number> = {};
    const keyToOrders: Record<string, number> = {};
    const keyToInvoices: Record<string, number> = {};

    function getKey(d: Date): string {
      if (breakdownKind === 'monthly') {
        return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
      }
      return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
    }

    for (const inv of invoices) {
      const at = inv.issuedAt ?? new Date(0);
      const key = getKey(at);
      keyToBilled[key] = (keyToBilled[key] ?? 0) + inv.total;
      keyToInvoices[key] = (keyToInvoices[key] ?? 0) + 1;
    }
    for (const p of payments) {
      const key = getKey(p.createdAt);
      keyToCollected[key] = (keyToCollected[key] ?? 0) + p.amount;
    }
    for (const o of ordersInRange) {
      const key = getKey(o.createdAt);
      keyToOrders[key] = (keyToOrders[key] ?? 0) + 1;
    }

    const allKeys = new Set([
      ...Object.keys(keyToBilled),
      ...Object.keys(keyToCollected),
      ...Object.keys(keyToOrders),
    ]);
    const breakdown: RevenueBreakdownItem[] = Array.from(allKeys)
      .sort()
      .map((key) => ({
        key,
        billedPaise: keyToBilled[key] ?? 0,
        collectedPaise: keyToCollected[key] ?? 0,
        ordersCount: keyToOrders[key] ?? 0,
        invoicesCount: keyToInvoices[key] ?? 0,
      }));

    return {
      billedPaise,
      collectedPaise,
      ordersCount: ordersInRange.length,
      invoicesCount: invoices.length,
      breakdown,
    };
  }
}
