export interface LaundryItemRecord {
  id: string;
  name: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LaundryItemsRepo {
  create(name: string, active: boolean): Promise<LaundryItemRecord>;
  update(id: string, patch: { name?: string; active?: boolean }): Promise<LaundryItemRecord>;
  listAll(): Promise<LaundryItemRecord[]>;
  listActive(): Promise<LaundryItemRecord[]>;
  getById(id: string): Promise<LaundryItemRecord | null>;
}
