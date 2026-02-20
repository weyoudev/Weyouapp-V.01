import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { OrderType, ServiceType } from '@shared/enums';
import type {
  CustomersRepo,
  AddressesRepo,
  OrdersRepo,
  BranchRepo,
  ServiceAreaRepo,
} from '../../../application/ports';
import {
  CUSTOMERS_REPO,
  ADDRESSES_REPO,
  ORDERS_REPO,
  BRANCH_REPO,
  SERVICE_AREA_REPO,
} from '../../../infra/infra.module';

const WALK_IN_SOURCE = 'WALK_IN';

@Injectable()
export class WalkInService {
  constructor(
    @Inject(CUSTOMERS_REPO) private readonly customersRepo: CustomersRepo,
    @Inject(ADDRESSES_REPO) private readonly addressesRepo: AddressesRepo,
    @Inject(ORDERS_REPO) private readonly ordersRepo: OrdersRepo,
    @Inject(BRANCH_REPO) private readonly branchRepo: BranchRepo,
    @Inject(SERVICE_AREA_REPO) private readonly serviceAreaRepo: ServiceAreaRepo,
  ) {}

  async lookupCustomer(phone: string) {
    const normalized = phone.trim();
    if (!normalized) throw new BadRequestException('Phone is required');
    return this.customersRepo.getByPhone(normalized);
  }

  async createCustomer(phone: string, name?: string | null, email?: string | null) {
    const normalized = phone.trim();
    if (!normalized) throw new BadRequestException('Phone is required');
    return this.customersRepo.create({
      phone: normalized,
      name: name?.trim() || null,
      email: email?.trim() || null,
    });
  }

  async createOrder(userId: string, branchId: string) {
    const branch = await this.branchRepo.getById(branchId);
    if (!branch) throw new BadRequestException('Branch not found');

    const areas = await this.serviceAreaRepo.listByBranchId(branchId);
    const pincode = areas.length > 0 ? areas[0].pincode : '000000';
    const addressLine = branch.address || 'Walk-in';

    const address = await this.addressesRepo.create(userId, {
      label: 'Walk-in',
      addressLine,
      pincode,
      isDefault: false,
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const order = await this.ordersRepo.create({
      userId,
      orderType: OrderType.INDIVIDUAL,
      serviceType: ServiceType.WASH_IRON,
      serviceTypes: [ServiceType.WASH_IRON],
      addressId: address.id,
      pincode,
      pickupDate: today,
      timeWindow: 'Walk-in',
      branchId,
      orderSource: WALK_IN_SOURCE,
    });

    return order;
  }
}
