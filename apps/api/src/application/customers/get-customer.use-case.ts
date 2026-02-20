import { AppError } from '../errors';
import type { CustomersRepo, CustomerRecord } from '../ports';

export interface GetCustomerDeps {
  customersRepo: CustomersRepo;
}

export async function getCustomer(userId: string, deps: GetCustomerDeps): Promise<CustomerRecord> {
  const customer = await deps.customersRepo.getById(userId);
  if (!customer) {
    throw new AppError('CUSTOMER_NOT_FOUND', 'Customer not found', { userId });
  }
  return customer;
}
