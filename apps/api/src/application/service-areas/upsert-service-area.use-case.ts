import type { ServiceAreaRepo, ServiceAreaRecord } from '../ports';

export interface UpsertServiceAreaDeps {
  serviceAreaRepo: ServiceAreaRepo;
}

export async function upsertServiceArea(
  pincode: string,
  branchId: string,
  active: boolean,
  deps: UpsertServiceAreaDeps,
): Promise<ServiceAreaRecord> {
  return deps.serviceAreaRepo.upsert(pincode, branchId, active);
}
