import type { ServiceType } from '@shared/enums';
import type { LaundryItemsRepo, LaundryItemPricesRepo } from '../ports';

export interface CatalogItemWithPrice {
  itemId: string;
  name: string;
  unitPricePaise: number;
  serviceType: ServiceType;
}

export interface ListCatalogForServiceDeps {
  laundryItemsRepo: LaundryItemsRepo;
  laundryItemPricesRepo: LaundryItemPricesRepo;
}

/**
 * Returns active laundry items that have an active price for the given service type.
 * Used for customer catalog GET /api/items?serviceType=...
 */
export async function listCatalogForService(
  serviceType: ServiceType,
  deps: ListCatalogForServiceDeps,
): Promise<CatalogItemWithPrice[]> {
  const prices = await deps.laundryItemPricesRepo.listActiveForService(serviceType);
  const result: CatalogItemWithPrice[] = [];
  for (const p of prices) {
    const item = await deps.laundryItemsRepo.getById(p.itemId);
    if (item?.active) {
      result.push({
        itemId: item.id,
        name: item.name,
        unitPricePaise: p.unitPricePaise,
        serviceType: p.serviceType,
      });
    }
  }
  return result;
}
