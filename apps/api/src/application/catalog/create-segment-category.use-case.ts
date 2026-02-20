import { AppError } from '../errors';
import type { SegmentCategoryRepo, SegmentCategoryRecord } from '../ports';

export interface CreateSegmentCategoryInput {
  code: string;
  label: string;
  isActive?: boolean;
}

export interface CreateSegmentCategoryDeps {
  segmentCategoryRepo: SegmentCategoryRepo;
}

const CODE_REGEX = /^[A-Z][A-Z0-9_]*$/;

export async function createSegmentCategory(
  input: CreateSegmentCategoryInput,
  deps: CreateSegmentCategoryDeps,
): Promise<SegmentCategoryRecord> {
  const code = input.code.trim().toUpperCase().replace(/\s+/g, '_');
  if (!CODE_REGEX.test(code)) {
    throw new AppError('INVALID_CODE', 'Segment category code must be uppercase letters, numbers, and underscores');
  }
  const existing = await deps.segmentCategoryRepo.getByCode(code);
  if (existing) {
    throw new AppError('SEGMENT_CATEGORY_EXISTS', 'A segment category with this code already exists', { code });
  }
  return deps.segmentCategoryRepo.create(code, input.label.trim() || code, input.isActive ?? true);
}
