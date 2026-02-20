import type { CustomersRepo, CustomerRecord } from '../ports';

export interface SearchCustomersByPhoneDeps {
  customersRepo: CustomersRepo;
}

export async function searchCustomersByPhone(
  phoneLike: string,
  deps: SearchCustomersByPhoneDeps,
): Promise<CustomerRecord[]> {
  return deps.customersRepo.findByPhone(phoneLike);
}
