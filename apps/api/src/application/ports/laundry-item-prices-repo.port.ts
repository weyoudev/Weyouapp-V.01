import type { ServiceType } from '@shared/enums';

export interface LaundryItemPriceRecord {
  id: string;
  itemId: string;
  serviceType: ServiceType;
  unitPricePaise: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LaundryItemPricesRepo {
  upsertPrice(
    itemId: string,
    serviceType: ServiceType,
    unitPricePaise: number,
    active: boolean,
  ): Promise<LaundryItemPriceRecord>;
  listForItem(itemId: string): Promise<LaundryItemPriceRecord[]>;
  listActiveForService(serviceType: ServiceType): Promise<LaundryItemPriceRecord[]>;
}
