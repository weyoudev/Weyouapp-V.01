export interface OperatingHoursRecord {
  id: string;
  branchId: string | null;
  startTime: string; // "09:00"
  endTime: string;   // "18:00"
}

export interface OperatingHoursRepo {
  /** Get operating hours for a branch. branchId required; no default/fallback. */
  get(branchId?: string | null): Promise<OperatingHoursRecord | null>;
  /** Set operating hours for a branch. branchId required. */
  set(branchId: string, startTime: string, endTime: string): Promise<OperatingHoursRecord>;
}
