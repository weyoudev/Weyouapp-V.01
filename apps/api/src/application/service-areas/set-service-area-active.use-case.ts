import type { ServiceAreaRepo, ServiceAreaRecord } from '../ports';

export interface SetServiceAreaActiveDeps {
  serviceAreaRepo: ServiceAreaRepo;
}

export async function setServiceAreaActive(
  pincode: string,
  active: boolean,
  deps: SetServiceAreaActiveDeps,
): Promise<ServiceAreaRecord> {
  return deps.serviceAreaRepo.setActive(pincode, active);
}
