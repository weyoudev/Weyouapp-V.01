export interface CustomerRecord {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  role: string;
  notes: string | null;
  expoPushToken: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateCustomerPatch {
  name?: string | null;
  email?: string | null;
  notes?: string | null;
  expoPushToken?: string | null;
}

export interface ListCustomersResult {
  data: CustomerRecord[];
  nextCursor: string | null;
}

export interface CreateCustomerInput {
  phone: string;
  name?: string | null;
  email?: string | null;
}

export interface CustomersRepo {
  findByPhone(phoneLike: string): Promise<CustomerRecord[]>;
  /** Exact match by phone (for walk-in lookup). Returns null if not found or not CUSTOMER. */
  getByPhone(phone: string): Promise<CustomerRecord | null>;
  getById(userId: string): Promise<CustomerRecord | null>;
  /** Create a customer (User with role CUSTOMER). Phone must be unique. */
  create(input: CreateCustomerInput): Promise<CustomerRecord>;
  update(userId: string, patch: UpdateCustomerPatch): Promise<CustomerRecord>;
  /** Total number of users with role CUSTOMER. */
  count(): Promise<number>;
  /** List customers with optional cursor and search (phone/name). */
  list(limit: number, cursor?: string | null, search?: string | null): Promise<ListCustomersResult>;
}
