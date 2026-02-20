/**
 * Pure helpers for revenue metrics.
 * Billed = FINAL + ISSUED invoices. Collected = CAPTURED payments.
 */

export interface InvoiceRow {
  type: string;
  status: string;
  total: number;
  createdAt: Date;
}

export interface PaymentRow {
  status: string;
  amount: number;
  createdAt: Date;
}

export function getBilledRevenue(invoices: InvoiceRow[], dateFrom: Date, dateTo: Date): number {
  return invoices
    .filter(
      (inv) =>
        inv.type === 'FINAL' &&
        inv.status === 'ISSUED' &&
        inv.createdAt >= dateFrom &&
        inv.createdAt < dateTo,
    )
    .reduce((sum, inv) => sum + inv.total, 0);
}

export function getCollectedRevenue(payments: PaymentRow[], dateFrom: Date, dateTo: Date): number {
  return payments
    .filter(
      (p) =>
        p.status === 'CAPTURED' && p.createdAt >= dateFrom && p.createdAt < dateTo,
    )
    .reduce((sum, p) => sum + p.amount, 0);
}
