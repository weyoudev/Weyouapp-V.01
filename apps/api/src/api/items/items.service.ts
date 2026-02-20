import { Inject, Injectable } from '@nestjs/common';
import { listCatalogForService } from '../../application/catalog/list-catalog-for-service.use-case';
import type { ServiceType } from '@shared/enums';
import type { LaundryItemsRepo, LaundryItemPricesRepo } from '../../application/ports';
import { LAUNDRY_ITEMS_REPO, LAUNDRY_ITEM_PRICES_REPO } from '../../infra/infra.module';

@Injectable()
export class ItemsService {
  constructor(
    @Inject(LAUNDRY_ITEMS_REPO) private readonly laundryItemsRepo: LaundryItemsRepo,
    @Inject(LAUNDRY_ITEM_PRICES_REPO) private readonly laundryItemPricesRepo: LaundryItemPricesRepo,
  ) {}

  async listForService(serviceType: ServiceType) {
    return listCatalogForService(serviceType, {
      laundryItemsRepo: this.laundryItemsRepo,
      laundryItemPricesRepo: this.laundryItemPricesRepo,
    });
  }
}
