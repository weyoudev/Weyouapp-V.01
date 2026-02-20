export interface ServiceAreaRecord {
  id: string;
  pincode: string;
  branchId: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateServiceAreaPatch {
  branchId?: string;
  active?: boolean;
}

export interface ServiceAreaRepo {
  isServiceable(pincode: string): Promise<boolean>;
  listAll(): Promise<ServiceAreaRecord[]>;
  listByBranchId(branchId: string): Promise<ServiceAreaRecord[]>;
  getByPincode(pincode: string): Promise<ServiceAreaRecord | null>;
  /**
   * Creates or updates service area for the given branch. Fails if pincode is already assigned to another branch.
   */
  upsert(pincode: string, branchId: string, active: boolean): Promise<ServiceAreaRecord>;
  setActive(pincode: string, active: boolean): Promise<ServiceAreaRecord>;
  update(pincode: string, patch: UpdateServiceAreaPatch): Promise<ServiceAreaRecord>;
  remove(pincode: string): Promise<void>;
}

