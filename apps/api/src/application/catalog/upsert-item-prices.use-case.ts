import { AppError } from '../errors';
import type { ServiceType } from '@shared/enums';
import type { LaundryItemsRepo, LaundryItemPricesRepo, LaundryItemPriceRecord } from '../ports';

export interface UpsertItemPricesInput {
  itemId: string;
  prices: Array<{ serviceType: ServiceType; unitPricePaise: number; active?: boolean }>;
}

export interface UpsertItemPricesDeps {
  laundryItemsRepo: LaundryItemsRepo;
  laundryItemPricesRepo: LaundryItemPricesRepo;
}

export async function upsertItemPrices(
  input: UpsertItemPricesInput,
  deps: UpsertItemPricesDeps,
): Promise<LaundryItemPriceRecord[]> {
  const item = await deps.laundryItemsRepo.getById(input.itemId);
  if (!item) {
    throw new AppError('ITEM_NOT_FOUND', 'Laundry item not found', { itemId: input.itemId });
  }
  const results: LaundryItemPriceRecord[] = [];
  for (const p of input.prices) {
    const record = await deps.laundryItemPricesRepo.upsertPrice(
      input.itemId,
      p.serviceType,
      p.unitPricePaise,
      p.active ?? true,
    );
    results.push(record);
  }
  return results;
}
