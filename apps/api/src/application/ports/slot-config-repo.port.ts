export interface SlotIdentifier {
  date: Date;
  timeWindow: string;
  pincode: string;
}

export interface SlotConfigRecord {
  id: string;
  date: Date;
  timeWindow: string;
  pincode: string | null;
  capacity: number;
}

export interface SlotConfigRepo {
  getSlot(id: SlotIdentifier): Promise<SlotConfigRecord | null>;
  countOrdersForSlot(id: SlotIdentifier): Promise<number>;
  createSlot(id: SlotIdentifier, capacity: number): Promise<SlotConfigRecord>;
}

