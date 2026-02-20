import { Inject, Injectable } from '@nestjs/common';
import { listItemsAdmin } from '../../../application/catalog/list-items.use-case';
import { createLaundryItem } from '../../../application/catalog/create-laundry-item.use-case';
import { updateLaundryItem } from '../../../application/catalog/update-laundry-item.use-case';
import { upsertItemPrices } from '../../../application/catalog/upsert-item-prices.use-case';
import { listCatalogItemsWithMatrix } from '../../../application/catalog/list-catalog-items-with-matrix.use-case';
import { updateCatalogItemWithMatrix } from '../../../application/catalog/update-catalog-item-with-matrix.use-case';
import { createServiceCategory } from '../../../application/catalog/create-service-category.use-case';
import { createSegmentCategory } from '../../../application/catalog/create-segment-category.use-case';
import { importCatalogFromFile } from '../../../application/catalog/import-catalog-from-file.use-case';
import type { ServiceType } from '@shared/enums';
import type {
  LaundryItemBranchRepo,
  LaundryItemsRepo,
  LaundryItemPricesRepo,
  ServiceCategoryRepo,
  SegmentCategoryRepo,
  ItemSegmentServicePriceRepo,
} from '../../../application/ports';
import {
  LAUNDRY_ITEM_BRANCH_REPO,
  LAUNDRY_ITEMS_REPO,
  LAUNDRY_ITEM_PRICES_REPO,
  SERVICE_CATEGORY_REPO,
  SEGMENT_CATEGORY_REPO,
  ITEM_SEGMENT_SERVICE_PRICE_REPO,
} from '../../../infra/infra.module';

@Injectable()
export class AdminCatalogService {
  constructor(
    @Inject(LAUNDRY_ITEMS_REPO) private readonly laundryItemsRepo: LaundryItemsRepo,
    @Inject(LAUNDRY_ITEM_BRANCH_REPO) private readonly laundryItemBranchRepo: LaundryItemBranchRepo,
    @Inject(LAUNDRY_ITEM_PRICES_REPO) private readonly laundryItemPricesRepo: LaundryItemPricesRepo,
    @Inject(SERVICE_CATEGORY_REPO) private readonly serviceCategoryRepo: ServiceCategoryRepo,
    @Inject(SEGMENT_CATEGORY_REPO) private readonly segmentCategoryRepo: SegmentCategoryRepo,
    @Inject(ITEM_SEGMENT_SERVICE_PRICE_REPO) private readonly itemSegmentServicePriceRepo: ItemSegmentServicePriceRepo,
  ) {}

  async listItems(withPrices = false) {
    const items = await listItemsAdmin({ laundryItemsRepo: this.laundryItemsRepo });
    if (!withPrices) return items;
    const withPricesList = await Promise.all(
      items.map(async (item) => {
        const prices = await this.laundryItemPricesRepo.listForItem(item.id);
        return {
          ...item,
          prices: prices.map((p) => ({
            id: p.id,
            itemId: p.itemId,
            serviceType: p.serviceType,
            unitPricePaise: p.unitPricePaise,
            active: p.active,
            createdAt: p.createdAt,
            updatedAt: p.updatedAt,
          })),
        };
      })
    );
    return withPricesList;
  }

  async createItem(name: string, active: boolean) {
    return createLaundryItem(name, active, {
      laundryItemsRepo: this.laundryItemsRepo,
    });
  }

  async updateItem(id: string, patch: { name?: string; active?: boolean }) {
    return updateLaundryItem(id, patch, {
      laundryItemsRepo: this.laundryItemsRepo,
    });
  }

  async upsertItemPrices(
    itemId: string,
    prices: Array<{ serviceType: ServiceType; unitPricePaise: number; active?: boolean }>,
  ) {
    return upsertItemPrices(
      { itemId, prices },
      {
        laundryItemsRepo: this.laundryItemsRepo,
        laundryItemPricesRepo: this.laundryItemPricesRepo,
      },
    );
  }

  async listItemsWithMatrix() {
    const result = await listCatalogItemsWithMatrix({
      laundryItemsRepo: this.laundryItemsRepo,
      serviceCategoryRepo: this.serviceCategoryRepo,
      segmentCategoryRepo: this.segmentCategoryRepo,
      itemSegmentServicePriceRepo: this.itemSegmentServicePriceRepo,
    });
    const itemsWithBranches = await Promise.all(
      result.items.map(async (item) => {
        const branchIds = await this.laundryItemBranchRepo.getBranchIdsForItem(item.id);
        return { ...item, branchIds };
      }),
    );
    return { ...result, items: itemsWithBranches };
  }

  async updateItemWithMatrix(
    itemId: string,
    body: {
      name?: string;
      active?: boolean;
      segmentPrices: Array<{ segmentCategoryId: string; serviceCategoryId: string; priceRupees: number; isActive?: boolean }>;
      branchIds?: string[];
    },
  ) {
    const result = await updateCatalogItemWithMatrix(
      {
        itemId,
        name: body.name,
        active: body.active,
        segmentPrices: body.segmentPrices.map((p) => ({
          segmentCategoryId: p.segmentCategoryId,
          serviceCategoryId: p.serviceCategoryId,
          priceRupees: p.priceRupees,
          isActive: p.isActive ?? true,
        })),
      },
      {
        laundryItemsRepo: this.laundryItemsRepo,
        laundryItemPricesRepo: this.laundryItemPricesRepo,
        serviceCategoryRepo: this.serviceCategoryRepo,
        segmentCategoryRepo: this.segmentCategoryRepo,
        itemSegmentServicePriceRepo: this.itemSegmentServicePriceRepo,
      },
    );
    const branchIds = body.branchIds ?? [];
    await this.laundryItemBranchRepo.setBranchesForItem(itemId, branchIds);
    return result;
  }

  async createServiceCategory(code: string, label: string, isActive?: boolean) {
    return createServiceCategory({ code, label, isActive }, { serviceCategoryRepo: this.serviceCategoryRepo });
  }

  async createSegmentCategory(code: string, label: string, isActive?: boolean) {
    return createSegmentCategory({ code, label, isActive }, { segmentCategoryRepo: this.segmentCategoryRepo });
  }

  async updateServiceCategory(id: string, patch: { label?: string; isActive?: boolean }) {
    return this.serviceCategoryRepo.update(id, patch);
  }

  async deleteServiceCategory(id: string) {
    return this.serviceCategoryRepo.delete(id);
  }

  async updateSegmentCategory(id: string, patch: { label?: string; isActive?: boolean }) {
    return this.segmentCategoryRepo.update(id, patch);
  }

  async deleteSegmentCategory(id: string) {
    return this.segmentCategoryRepo.delete(id);
  }

  async importCatalog(csvContent: string) {
    return importCatalogFromFile(csvContent, {
      laundryItemsRepo: this.laundryItemsRepo,
      serviceCategoryRepo: this.serviceCategoryRepo,
      segmentCategoryRepo: this.segmentCategoryRepo,
      itemSegmentServicePriceRepo: this.itemSegmentServicePriceRepo,
    });
  }

  getImportSampleCsv(): string {
    return 'itemName,segment,serviceCategoryCode,priceRupees,isActive\nShirt,MEN,STEAM_IRON,10,true\nShirt,MEN,DRY_CLEAN,50,true\nJeans,WOMEN,STEAM_IRON,20,true';
  }

  /** Price lookup for ACK line builder: item + segment + service category. Returns price in rupees or null. */
  async getPriceLookup(
    itemId: string,
    segmentCategoryId: string,
    serviceCategoryId: string,
  ): Promise<{ priceRupees: number } | null> {
    const prices = await this.itemSegmentServicePriceRepo.listByItemId(itemId);
    const match = prices.find(
      (p) =>
        p.segmentCategoryId === segmentCategoryId &&
        p.serviceCategoryId === serviceCategoryId &&
        p.isActive,
    );
    return match ? { priceRupees: match.priceRupees } : null;
  }
}
