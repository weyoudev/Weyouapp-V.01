import type { CustomersRepo, CustomerRecord, UpdateCustomerPatch } from '../ports';

export interface UpdateCustomerDeps {
  customersRepo: CustomersRepo;
}

export async function updateCustomer(
  userId: string,
  patch: UpdateCustomerPatch,
  deps: UpdateCustomerDeps,
): Promise<CustomerRecord> {
  return deps.customersRepo.update(userId, patch);
}
