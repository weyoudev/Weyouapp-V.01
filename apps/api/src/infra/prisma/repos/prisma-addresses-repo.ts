import type { PrismaClient } from '@prisma/client';
import type {
  AddressListRecord,
  AddressRecord,
  AddressesRepo,
  CreateAddressInput,
  DefaultAddressRecord,
  UpdateAddressPatch,
} from '../../../application/ports';

type PrismaLike = Pick<PrismaClient, 'address'>;

export class PrismaAddressesRepo implements AddressesRepo {
  constructor(private readonly prisma: PrismaLike) {}

  async getById(id: string): Promise<AddressRecord | null> {
    const row = await this.prisma.address.findUnique({ where: { id } });
    if (!row) return null;
    return {
      id: row.id,
      userId: row.userId,
      pincode: row.pincode,
    };
  }

  async getByIdForUser(id: string, userId: string): Promise<AddressListRecord | null> {
    const row = await this.prisma.address.findFirst({
      where: { id, userId },
    });
    if (!row) return null;
    return toListRecord(row);
  }

  async listByUserId(userId: string): Promise<AddressListRecord[]> {
    const rows = await this.prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });
    return rows.map(toListRecord);
  }

  async findDefaultByUserId(userId: string): Promise<DefaultAddressRecord | null> {
    const row = await this.prisma.address.findFirst({
      where: { userId, isDefault: true },
      select: { id: true, pincode: true },
    });
    return row;
  }

  async create(userId: string, input: CreateAddressInput): Promise<AddressRecord> {
    const isDefault = input.isDefault ?? true;
    if (isDefault) {
      await this.prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }
    const row = await this.prisma.address.create({
      data: {
        userId,
        label: input.label,
        addressLine: input.addressLine,
        pincode: input.pincode,
        isDefault,
        ...(input.houseNo != null && { houseNo: input.houseNo || null }),
        ...(input.streetArea != null && { streetArea: input.streetArea || null }),
        ...(input.city != null && { city: input.city || null }),
        ...(input.googleMapUrl != null && { googleMapUrl: input.googleMapUrl || null }),
      },
    });
    return {
      id: row.id,
      userId: row.userId,
      pincode: row.pincode,
    };
  }

  async update(id: string, userId: string, patch: UpdateAddressPatch): Promise<AddressListRecord> {
    const existing = await this.prisma.address.findFirst({ where: { id, userId } });
    if (!existing) throw new Error('ADDRESS_NOT_FOUND');
    if (patch.isDefault === true) {
      await this.prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }
    const row = await this.prisma.address.update({
      where: { id },
      data: {
        ...(patch.label != null && { label: patch.label }),
        ...(patch.addressLine != null && { addressLine: patch.addressLine }),
        ...(patch.pincode != null && { pincode: patch.pincode }),
        ...(patch.isDefault != null && { isDefault: patch.isDefault }),
        ...(patch.houseNo !== undefined && { houseNo: patch.houseNo || null }),
        ...(patch.streetArea !== undefined && { streetArea: patch.streetArea || null }),
        ...(patch.city !== undefined && { city: patch.city || null }),
        ...(patch.googleMapUrl !== undefined && { googleMapUrl: patch.googleMapUrl || null }),
      },
    });
    return toListRecord(row);
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.prisma.address.deleteMany({
      where: { id, userId },
    });
  }
}

function toListRecord(row: {
  id: string;
  userId: string;
  label: string;
  addressLine: string;
  pincode: string;
  isDefault: boolean;
  houseNo?: string | null;
  streetArea?: string | null;
  city?: string | null;
  googleMapUrl?: string | null;
}): AddressListRecord {
  return {
    id: row.id,
    userId: row.userId,
    label: row.label,
    addressLine: row.addressLine,
    pincode: row.pincode,
    isDefault: row.isDefault,
    houseNo: row.houseNo ?? undefined,
    streetArea: row.streetArea ?? undefined,
    city: row.city ?? undefined,
    googleMapUrl: row.googleMapUrl ?? undefined,
  };
}

