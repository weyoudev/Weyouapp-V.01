import type { OrdersRepo, AdminOrdersFilters, AdminOrdersResult } from '../ports';

export interface AdminListOrdersDeps {
  ordersRepo: OrdersRepo;
}

export async function adminListOrders(
  filters: AdminOrdersFilters,
  deps: AdminListOrdersDeps,
): Promise<AdminOrdersResult> {
  return deps.ordersRepo.adminList(filters);
}
