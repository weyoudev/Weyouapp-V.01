export interface SegmentCategoryRecord {
  id: string;
  code: string;
  label: string;
  isActive: boolean;
  createdAt: Date;
}

export interface SegmentCategoryRepo {
  create(code: string, label: string, isActive?: boolean): Promise<SegmentCategoryRecord>;
  getById(id: string): Promise<SegmentCategoryRecord | null>;
  getByCode(code: string): Promise<SegmentCategoryRecord | null>;
  update(id: string, patch: { label?: string; isActive?: boolean }): Promise<SegmentCategoryRecord>;
  delete(id: string): Promise<void>;
  listAll(): Promise<SegmentCategoryRecord[]>;
  listActive(): Promise<SegmentCategoryRecord[]>;
}
