import type { ServiceAreaRepo, ServiceAreaRecord } from '../ports';

export interface ListServiceAreasDeps {
  serviceAreaRepo: ServiceAreaRepo;
}

export async function listServiceAreas(deps: ListServiceAreasDeps, branchId?: string): Promise<ServiceAreaRecord[]> {
  if (branchId) return deps.serviceAreaRepo.listByBranchId(branchId);
  return deps.serviceAreaRepo.listAll();
}
