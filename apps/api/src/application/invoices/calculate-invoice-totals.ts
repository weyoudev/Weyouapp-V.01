import type { InvoiceItemType } from '@shared/enums';

/**
 * Input line item: amount can be provided or computed from quantity * unitPrice.
 * For DISCOUNT, unitPrice or amount may be negative.
 */
export interface InvoiceItemInput {
  type: InvoiceItemType;
  name: string;
  quantity: number;
  unitPrice: number; // paise
  amount?: number; // paise; if omitted, computed as quantity * unitPrice
}

export interface InvoiceTotalsResult {
  subtotal: number; // paise
  tax: number; // paise
  total: number; // paise
  items: { amount: number }[];
}

/**
 * Pure function: compute subtotal, tax, total from line items.
 * Enforces amount = quantity * unitPrice for non-discount; for DISCOUNT, amount can be negative.
 * Tax defaults to 0 if not provided.
 */
export function calculateInvoiceTotals(
  items: InvoiceItemInput[],
  taxPaise: number = 0,
): InvoiceTotalsResult {
  const resolved = items.map((item) => {
    const amount =
      item.amount !== undefined
        ? item.amount
        : Math.round(item.quantity * item.unitPrice);
    return { ...item, amount };
  });

  const subtotal = resolved.reduce((sum, i) => sum + i.amount, 0);
  const total = subtotal + taxPaise;

  return {
    subtotal,
    tax: taxPaise,
    total,
    items: resolved.map((i) => ({ amount: i.amount })),
  };
}
