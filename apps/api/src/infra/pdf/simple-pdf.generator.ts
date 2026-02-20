import type { PdfGenerator, InvoicePdfAggregate } from '../../application/ports';

/** Escape string for PDF text operator Tj: \ ( ) must be escaped. */
function pdfEscape(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

/**
 * Builds a minimal PDF (PDF 1.1) with invoice content as text using proper BT/ET and Tj operators
 * so viewers render the text (raw text in stream would appear blank).
 */
function buildMinimalPdf(aggregate: InvoicePdfAggregate): Buffer {
  const lines: string[] = [];
  const b = aggregate.branding;
  lines.push('INVOICE');
  lines.push(`Type: ${aggregate.type}`);
  lines.push(`Invoice #: ${aggregate.invoiceId}`);
  if (aggregate.type === 'SUBSCRIPTION') {
    lines.push('Subscription purchase');
  } else {
    lines.push(`Order ID: ${aggregate.orderId ?? 'N/A'}`);
  }
  lines.push(`Issued: ${aggregate.issuedAt.toISOString()}`);
  lines.push('');
  lines.push('Business:');
  lines.push(b.businessName);
  lines.push(b.address);
  lines.push(b.phone);
  if (b.gstNumber) lines.push(`GST: ${b.gstNumber}`);
  if (b.panNumber) lines.push(`PAN: ${b.panNumber}`);
  if (b.footerNote) lines.push(`Note: ${b.footerNote}`);
  lines.push('');
  if (aggregate.customerName != null || aggregate.customerPhone != null) {
    lines.push('Customer:');
    if (aggregate.customerName) lines.push(aggregate.customerName);
    if (aggregate.customerPhone) lines.push(aggregate.customerPhone);
    lines.push('');
  }
  lines.push('Items:');
  for (const item of aggregate.items) {
    lines.push(`  ${item.name} x ${item.quantity} @ ${(item.unitPrice / 100).toFixed(2)} = ${(item.amount / 100).toFixed(2)}`);
  }
  if (aggregate.discountPaise != null && aggregate.discountPaise > 0) {
    lines.push(`  Discount: -${(aggregate.discountPaise / 100).toFixed(2)}`);
  }
  lines.push('');
  lines.push(`Subtotal: ${(aggregate.subtotal / 100).toFixed(2)}`);
  lines.push(`Tax: ${(aggregate.tax / 100).toFixed(2)}`);
  lines.push(`Total: ${(aggregate.total / 100).toFixed(2)}`);

  const f = aggregate.footer;
  const footerLine1 = [f.address, f.email, f.phone].filter(Boolean).join(' | ');
  const footerLine2 = "It's a computer generated invoice, Signature not required.";
  const LINE_WIDTH = 72;
  const centerPad = (s: string) => {
    const len = s.length;
    if (len >= LINE_WIDTH) return s;
    const left = Math.floor((LINE_WIDTH - len) / 2);
    return ' '.repeat(left) + s;
  };
  lines.push('');
  lines.push(centerPad(footerLine1));
  lines.push(centerPad(footerLine2));

  if (b.upiId) {
    lines.push('');
    lines.push(`UPI ID: ${b.upiId}`);
    if (b.upiPayeeName) lines.push(`Pay to: ${b.upiPayeeName}`);
  }
  if (b.upiQrUrl) {
    lines.push('QR code available at: ' + b.upiQrUrl);
  }
  if (aggregate.subscriptionSummary) {
    lines.push('');
    lines.push('Subscription (usage):');
    lines.push(`  Used kg: ${aggregate.subscriptionSummary.usedKg}, Items: ${aggregate.subscriptionSummary.usedItemsCount}`);
    lines.push(`  Remaining pickups: ${aggregate.subscriptionSummary.remainingPickups}`);
    lines.push(`  Expiry: ${aggregate.subscriptionSummary.expiryDate.toISOString()}`);
  }
  if (aggregate.subscriptionPurchaseSummary) {
    lines.push('');
    lines.push('Subscription plan:');
    lines.push(`  Valid till: ${aggregate.subscriptionPurchaseSummary.validTill.toISOString().slice(0, 10)}`);
    lines.push(`  No. of pickups: ${aggregate.subscriptionPurchaseSummary.maxPickups}`);
    const kg = aggregate.subscriptionPurchaseSummary.kgLimit;
    const items = aggregate.subscriptionPurchaseSummary.itemsLimit;
    if (kg != null || items != null) {
      lines.push(`  Weight/items limit: ${kg != null ? kg + ' kg' : 'N/A'} / ${items != null ? items + ' items' : 'N/A'}`);
    }
  }

  if (b.termsAndConditions && b.termsAndConditions.trim()) {
    lines.push('');
    lines.push('Terms and Conditions:');
    const termsLines = b.termsAndConditions.trim().split(/\r?\n/);
    for (const line of termsLines) {
      const trimmed = line.trim();
      if (trimmed) lines.push('  ' + trimmed);
    }
  }

  const fontSize = 11;
  const lineHeight = 14;
  const marginX = 50;
  let y = 750;
  const contentParts: string[] = ['BT', '/F1 ' + fontSize + ' Tf'];
  for (const line of lines) {
    contentParts.push('1 0 0 1 ' + marginX + ' ' + y + ' Tm');
    contentParts.push('(' + pdfEscape(line) + ') Tj');
    y -= lineHeight;
  }
  contentParts.push('ET');
  const streamBody = contentParts.join('\n');
  const header = '%PDF-1.1\n';
  const obj1 = '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n';
  const obj2 = '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n';
  const obj3 = '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> /Contents 4 0 R >> endobj\n';
  const streamLen = Buffer.byteLength(streamBody, 'utf8');
  const obj4 = '4 0 obj << /Length ' + streamLen + ' >> stream\n' + streamBody + '\nendstream endobj\n';

  const parts = [header, obj1, obj2, obj3, obj4];
  let offset = 0;
  const offsets: number[] = [0];
  for (const p of parts) {
    offset += Buffer.byteLength(p, 'utf8');
    offsets.push(offset);
  }
  const xrefStart = offset;
  const xrefLines = [
    'xref',
    '0 5',
    '0000000000 65535 f ',
    String(offsets[1]).padStart(10) + ' 00000 n ',
    String(offsets[2]).padStart(10) + ' 00000 n ',
    String(offsets[3]).padStart(10) + ' 00000 n ',
    String(offsets[4]).padStart(10) + ' 00000 n ',
  ];
  const xref = xrefLines.join('\n') + '\n';
  const trailer = 'trailer << /Size 5 /Root 1 0 R >>\nstartxref\n' + String(xrefStart) + '\n%%EOF\n';
  const full = parts.join('') + xref + trailer;
  return Buffer.from(full, 'utf8');
}

export class SimplePdfGenerator implements PdfGenerator {
  async generateInvoicePdfBuffer(aggregate: InvoicePdfAggregate): Promise<Buffer> {
    return buildMinimalPdf(aggregate);
  }
}
