import { AppError } from '../errors';
import type { ServiceCategoryRepo, ServiceCategoryRecord } from '../ports';

export interface CreateServiceCategoryInput {
  code: string;
  label: string;
  isActive?: boolean;
}

export interface CreateServiceCategoryDeps {
  serviceCategoryRepo: ServiceCategoryRepo;
}

const CODE_REGEX = /^[A-Z][A-Z0-9_]*$/;

export async function createServiceCategory(
  input: CreateServiceCategoryInput,
  deps: CreateServiceCategoryDeps,
): Promise<ServiceCategoryRecord> {
  const code = input.code.trim().toUpperCase().replace(/\s+/g, '_');
  if (!CODE_REGEX.test(code)) {
    throw new AppError('INVALID_CODE', 'Service category code must be uppercase letters, numbers, and underscores');
  }
  const existing = await deps.serviceCategoryRepo.getByCode(code);
  if (existing) {
    throw new AppError('SERVICE_CATEGORY_EXISTS', 'A service category with this code already exists', { code });
  }
  return deps.serviceCategoryRepo.create(code, input.label.trim() || code, input.isActive ?? true);
}
