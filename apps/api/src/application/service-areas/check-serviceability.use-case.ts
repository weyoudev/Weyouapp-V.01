import type { ServiceAreaRepo, BranchRepo } from '../ports';

export interface CheckServiceabilityDeps {
  serviceAreaRepo: ServiceAreaRepo;
  branchRepo?: BranchRepo;
}

export interface ServiceabilityResult {
  serviceable: boolean;
  message: string;
  /** Set when serviceable and branchRepo provided. */
  branchId?: string | null;
  /** Set when serviceable and branchRepo provided. */
  branchName?: string | null;
}

export async function checkServiceability(
  pincode: string,
  deps: CheckServiceabilityDeps,
): Promise<ServiceabilityResult> {
  const serviceable = await deps.serviceAreaRepo.isServiceable(pincode);
  const result: ServiceabilityResult = {
    serviceable,
    message: serviceable
      ? 'Pincode is serviceable'
      : 'Sorry, we do not serve this pincode yet.',
  };
  if (serviceable && deps.branchRepo) {
    const area = await deps.serviceAreaRepo.getByPincode(pincode);
    if (area?.branchId) {
      const branch = await deps.branchRepo.getById(area.branchId);
      result.branchId = branch?.id ?? area.branchId;
      result.branchName = branch?.name ?? null;
    }
  }
  return result;
}
