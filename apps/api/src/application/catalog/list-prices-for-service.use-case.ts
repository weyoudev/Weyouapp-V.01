import type { ServiceType } from '@shared/enums';
import type { LaundryItemPricesRepo, LaundryItemPriceRecord } from '../ports';

export interface ListPricesForServiceDeps {
  laundryItemPricesRepo: LaundryItemPricesRepo;
}

export async function listPricesForService(
  serviceType: ServiceType,
  deps: ListPricesForServiceDeps,
): Promise<LaundryItemPriceRecord[]> {
  return deps.laundryItemPricesRepo.listActiveForService(serviceType);
}
