export interface ItemSegmentServicePriceRecord {
  id: string;
  itemId: string;
  segmentCategoryId: string;
  serviceCategoryId: string;
  priceRupees: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ItemSegmentServicePriceRepo {
  listByItemId(itemId: string): Promise<ItemSegmentServicePriceRecord[]>;
  replaceForItem(
    itemId: string,
    rows: Array<{
      segmentCategoryId: string;
      serviceCategoryId: string;
      priceRupees: number;
      isActive: boolean;
    }>,
  ): Promise<ItemSegmentServicePriceRecord[]>;
  upsert(
    itemId: string,
    segmentCategoryId: string,
    serviceCategoryId: string,
    priceRupees: number,
    isActive: boolean,
  ): Promise<ItemSegmentServicePriceRecord>;
}
