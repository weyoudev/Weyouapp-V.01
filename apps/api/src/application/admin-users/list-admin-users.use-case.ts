import type {
  AdminUsersRepo,
  AdminUsersFilters,
  AdminUsersResult,
} from '../ports';

export interface ListAdminUsersDeps {
  adminUsersRepo: AdminUsersRepo;
}

export async function listAdminUsers(
  filters: AdminUsersFilters,
  deps: ListAdminUsersDeps,
): Promise<AdminUsersResult> {
  return deps.adminUsersRepo.listAdmin(filters);
}

