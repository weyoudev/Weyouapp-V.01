import type { LaundryItemsRepo, LaundryItemRecord } from '../ports';

export interface ListItemsDeps {
  laundryItemsRepo: LaundryItemsRepo;
}

export async function listItemsAdmin(deps: ListItemsDeps): Promise<LaundryItemRecord[]> {
  return deps.laundryItemsRepo.listAll();
}

export async function listItemsActive(deps: ListItemsDeps): Promise<LaundryItemRecord[]> {
  return deps.laundryItemsRepo.listActive();
}
