export interface LaundryItemBranchRepo {
  getBranchIdsForItem(itemId: string): Promise<string[]>;
  setBranchesForItem(itemId: string, branchIds: string[]): Promise<void>;
}
