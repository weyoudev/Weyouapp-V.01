import { Inject, Injectable } from '@nestjs/common';
import { adminListOrders } from '../../../application/orders/admin-list-orders.use-case';
import { getOrderAdminSummary } from '../../../application/orders/get-order-admin-summary.use-case';
import type { AdminOrdersFilters, OrdersRepo } from '../../../application/ports';
import { ORDERS_REPO } from '../../../infra/infra.module';

@Injectable()
export class AdminOrdersService {
  constructor(@Inject(ORDERS_REPO) private readonly ordersRepo: OrdersRepo) {}

  async list(filters: AdminOrdersFilters) {
    return adminListOrders(filters, { ordersRepo: this.ordersRepo });
  }

  async getSummary(orderId: string) {
    return getOrderAdminSummary(orderId, { ordersRepo: this.ordersRepo });
  }
}
