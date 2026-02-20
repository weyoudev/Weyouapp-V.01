import * as fs from 'fs';
import * as path from 'path';
import { createReadStream } from 'fs';
import type { Readable } from 'stream';
import type { StorageAdapter } from '../../application/ports';

const LOCAL_STORAGE_ROOT = process.env.LOCAL_STORAGE_ROOT ?? './storage';

function getContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const map: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
  };
  return map[ext] ?? 'application/octet-stream';
}

export class LocalStorageAdapter implements StorageAdapter {
  private readonly root: string;

  constructor(root: string = LOCAL_STORAGE_ROOT) {
    this.root = path.resolve(root);
  }

  async putObject(pathKey: string, buffer: Buffer, _contentType: string): Promise<void> {
    const fullPath = path.join(this.root, pathKey);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    await fs.promises.writeFile(fullPath, buffer);
  }

  async getObjectStream(pathKey: string): Promise<Readable | null> {
    const fullPath = path.join(this.root, pathKey);
    try {
      await fs.promises.access(fullPath, fs.constants.R_OK);
    } catch {
      return null;
    }
    return createReadStream(fullPath);
  }

  /**
   * Infer contentType from path extension (e.g. for streaming responses).
   */
  getContentTypeForPath(pathKey: string): string {
    return getContentType(pathKey);
  }
}
