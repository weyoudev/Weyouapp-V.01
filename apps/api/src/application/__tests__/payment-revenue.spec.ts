/**
 * Payment CAPTURED contributes to collected revenue.
 * Billed revenue = FINAL + ISSUED invoices only.
 */
import { getBilledRevenue, getCollectedRevenue } from '../analytics/revenue-calculator';

describe('Revenue calculator', () => {
  const dateFrom = new Date('2025-06-01T00:00:00Z');
  const dateTo = new Date('2025-07-01T00:00:00Z');

  it('billed revenue sums only FINAL + ISSUED invoices in range', () => {
    const invoices = [
      { type: 'FINAL', status: 'ISSUED', total: 10000, createdAt: new Date('2025-06-15') },
      { type: 'ACKNOWLEDGEMENT', status: 'ISSUED', total: 5000, createdAt: new Date('2025-06-15') },
      { type: 'FINAL', status: 'DRAFT', total: 20000, createdAt: new Date('2025-06-15') },
      { type: 'FINAL', status: 'ISSUED', total: 30000, createdAt: new Date('2025-06-20') },
      { type: 'FINAL', status: 'ISSUED', total: 5000, createdAt: new Date('2025-05-15') },
    ];
    const billed = getBilledRevenue(invoices, dateFrom, dateTo);
    expect(billed).toBe(10000 + 30000);
  });

  it('collected revenue sums only CAPTURED payments in range', () => {
    const payments = [
      { status: 'CAPTURED', amount: 10000, createdAt: new Date('2025-06-10') },
      { status: 'PENDING', amount: 5000, createdAt: new Date('2025-06-10') },
      { status: 'CAPTURED', amount: 15000, createdAt: new Date('2025-06-15') },
      { status: 'CAPTURED', amount: 2000, createdAt: new Date('2025-05-01') },
    ];
    const collected = getCollectedRevenue(payments, dateFrom, dateTo);
    expect(collected).toBe(10000 + 15000);
  });
});
