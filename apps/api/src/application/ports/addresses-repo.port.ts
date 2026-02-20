export interface AddressRecord {
  id: string;
  userId: string;
  pincode: string;
}

/** Full address for list/edit (includes label, addressLine, houseNo, streetArea, city, isDefault, googleMapUrl). */
export interface AddressListRecord {
  id: string;
  userId: string;
  label: string;
  addressLine: string;
  houseNo?: string | null;
  streetArea?: string | null;
  city?: string | null;
  pincode: string;
  isDefault: boolean;
  googleMapUrl?: string | null;
}

/** For customer /me: default address (id + pincode for create-order). */
export interface DefaultAddressRecord {
  id: string;
  pincode: string;
}

export interface CreateAddressInput {
  label: string;
  addressLine: string;
  houseNo?: string | null;
  streetArea?: string | null;
  city?: string | null;
  pincode: string;
  isDefault?: boolean;
  googleMapUrl?: string | null;
}

export interface UpdateAddressPatch {
  label?: string;
  addressLine?: string;
  houseNo?: string | null;
  streetArea?: string | null;
  city?: string | null;
  pincode?: string;
  isDefault?: boolean;
  googleMapUrl?: string | null;
}

export interface AddressesRepo {
  getById(id: string): Promise<AddressRecord | null>;
  getByIdForUser(id: string, userId: string): Promise<AddressListRecord | null>;
  listByUserId(userId: string): Promise<AddressListRecord[]>;
  findDefaultByUserId(userId: string): Promise<DefaultAddressRecord | null>;
  create(userId: string, input: CreateAddressInput): Promise<AddressRecord>;
  update(id: string, userId: string, patch: UpdateAddressPatch): Promise<AddressListRecord>;
  delete(id: string, userId: string): Promise<void>;
}

