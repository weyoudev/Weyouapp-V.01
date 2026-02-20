import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PdfService {
  async generateInvoicePdf(invoiceId: string): Promise<string> {
    const root = process.env.LOCAL_STORAGE_ROOT || './storage';
    const dir = path.join(root, 'invoices');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const filePath = path.join(dir, `${invoiceId}.pdf`);
    const content = '%PDF-1.1\n% Minimal demo invoice PDF\n';
    fs.writeFileSync(filePath, content);
    // For now, just return the file path as URL placeholder.
    return filePath;
  }
}

