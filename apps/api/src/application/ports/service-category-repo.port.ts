export interface ServiceCategoryRecord {
  id: string;
  code: string;
  label: string;
  isActive: boolean;
  createdAt: Date;
}

export interface ServiceCategoryRepo {
  create(code: string, label: string, isActive?: boolean): Promise<ServiceCategoryRecord>;
  getById(id: string): Promise<ServiceCategoryRecord | null>;
  getByCode(code: string): Promise<ServiceCategoryRecord | null>;
  update(id: string, patch: { label?: string; isActive?: boolean }): Promise<ServiceCategoryRecord>;
  delete(id: string): Promise<void>;
  listAll(): Promise<ServiceCategoryRecord[]>;
  listActive(): Promise<ServiceCategoryRecord[]>;
}
