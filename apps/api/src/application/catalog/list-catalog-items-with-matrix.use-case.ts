import type {
  LaundryItemsRepo,
  LaundryItemRecord,
  ServiceCategoryRepo,
  ServiceCategoryRecord,
  SegmentCategoryRepo,
  SegmentCategoryRecord,
  ItemSegmentServicePriceRepo,
  ItemSegmentServicePriceRecord,
} from '../ports';

export interface CatalogItemWithMatrix extends LaundryItemRecord {
  segmentPrices: ItemSegmentServicePriceRecord[];
}

export interface ListCatalogItemsWithMatrixResult {
  items: CatalogItemWithMatrix[];
  serviceCategories: ServiceCategoryRecord[];
  segmentCategories: SegmentCategoryRecord[];
}

export interface ListCatalogItemsWithMatrixDeps {
  laundryItemsRepo: LaundryItemsRepo;
  serviceCategoryRepo: ServiceCategoryRepo;
  segmentCategoryRepo: SegmentCategoryRepo;
  itemSegmentServicePriceRepo: ItemSegmentServicePriceRepo;
}

export async function listCatalogItemsWithMatrix(
  deps: ListCatalogItemsWithMatrixDeps,
): Promise<ListCatalogItemsWithMatrixResult> {
  const [items, serviceCategories, segmentCategories] = await Promise.all([
    deps.laundryItemsRepo.listAll(),
    deps.serviceCategoryRepo.listAll(),
    deps.segmentCategoryRepo.listAll(),
  ]);
  const segmentPricesByItem = await Promise.all(
    items.map((item) => deps.itemSegmentServicePriceRepo.listByItemId(item.id)),
  );
  const itemsWithMatrix: CatalogItemWithMatrix[] = items.map((item, i) => ({
    ...item,
    segmentPrices: segmentPricesByItem[i] ?? [],
  }));
  return { items: itemsWithMatrix, serviceCategories, segmentCategories };
}
