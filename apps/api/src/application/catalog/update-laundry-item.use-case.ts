import { AppError } from '../errors';
import type { LaundryItemsRepo, LaundryItemRecord } from '../ports';

export interface UpdateLaundryItemDeps {
  laundryItemsRepo: LaundryItemsRepo;
}

export async function updateLaundryItem(
  id: string,
  patch: { name?: string; active?: boolean },
  deps: UpdateLaundryItemDeps,
): Promise<LaundryItemRecord> {
  const existing = await deps.laundryItemsRepo.getById(id);
  if (!existing) {
    throw new AppError('ITEM_NOT_FOUND', 'Laundry item not found', { id });
  }
  return deps.laundryItemsRepo.update(id, patch);
}
