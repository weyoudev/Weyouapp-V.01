import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { AddressesRepo, AddressListRecord, UpdateAddressPatch } from '../../application/ports';
import { ADDRESSES_REPO } from '../../infra/infra.module';
import type { AuthUser } from '../common/roles.guard';

@Injectable()
export class AddressesService {
  constructor(
    @Inject(ADDRESSES_REPO)
    private readonly addressesRepo: AddressesRepo,
  ) {}

  async listForCustomer(user: AuthUser): Promise<AddressListRecord[]> {
    return this.addressesRepo.listByUserId(user.id);
  }

  async createForCustomer(
    user: AuthUser,
    input: {
      label: string;
      addressLine: string;
      pincode: string;
      isDefault?: boolean;
      googleMapUrl?: string | null;
      houseNo?: string | null;
      streetArea?: string | null;
      city?: string | null;
    },
  ) {
    return this.addressesRepo.create(user.id, {
      label: input.label,
      addressLine: input.addressLine,
      pincode: input.pincode,
      isDefault: input.isDefault,
      googleMapUrl: input.googleMapUrl,
      houseNo: input.houseNo,
      streetArea: input.streetArea,
      city: input.city,
    });
  }

  async updateForCustomer(
    user: AuthUser,
    id: string,
    patch: UpdateAddressPatch,
  ): Promise<AddressListRecord> {
    const existing = await this.addressesRepo.getByIdForUser(id, user.id);
    if (!existing) throw new NotFoundException('Address not found');
    return this.addressesRepo.update(id, user.id, patch);
  }

  async deleteForCustomer(user: AuthUser, id: string): Promise<void> {
    const existing = await this.addressesRepo.getByIdForUser(id, user.id);
    if (!existing) throw new NotFoundException('Address not found');
    await this.addressesRepo.delete(id, user.id);
  }
}
