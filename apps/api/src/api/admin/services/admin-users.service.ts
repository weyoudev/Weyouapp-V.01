import { Inject, Injectable } from '@nestjs/common';
import { Role } from '@shared/enums';
import {
  createAdminUser,
  type CreateAdminUserInput,
} from '../../../application/admin-users/create-admin-user.use-case';
import {
  listAdminUsers,
  type ListAdminUsersDeps,
} from '../../../application/admin-users/list-admin-users.use-case';
import {
  updateAdminUser,
  type UpdateAdminUserInput,
} from '../../../application/admin-users/update-admin-user.use-case';
import type { AdminUsersRepo, AdminUsersFilters } from '../../../application/ports';
import { ADMIN_USERS_REPO } from '../../../infra/infra.module';
import { AppError } from '../../../application/errors';
import type { AuthUser } from '../../common/roles.guard';
import { generateTempPassword, hashAdminPassword } from '../../auth/password.util';

/** This user cannot be deleted by anyone. */
export const PROTECTED_ADMIN_EMAIL = 'weyou@admin.com';

@Injectable()
export class AdminUsersService {
  constructor(
    @Inject(ADMIN_USERS_REPO)
    private readonly adminUsersRepo: AdminUsersRepo,
  ) {}

  private get deps(): ListAdminUsersDeps {
    return { adminUsersRepo: this.adminUsersRepo };
  }

  async list(filters: AdminUsersFilters) {
    return listAdminUsers(filters, this.deps);
  }

  async create(input: CreateAdminUserInput) {
    if (![Role.ADMIN, Role.OPS].includes(input.role)) {
      throw new AppError('FEEDBACK_INVALID', 'Only Admin and Branch Head roles are allowed');
    }
    if (input.role === Role.OPS && !input.branchId) {
      throw new AppError('BRANCH_REQUIRED', 'Branch is required for Branch Head role');
    }
    const tempPassword = generateTempPassword(12);
    const user = await createAdminUser(
      {
        ...input,
        passwordHash: hashAdminPassword(tempPassword),
      },
      this.deps,
    );
    return { user, tempPassword };
  }

  async update(input: UpdateAdminUserInput, currentUser: AuthUser) {
    if (input.role && ![Role.ADMIN, Role.OPS].includes(input.role)) {
      throw new AppError('FEEDBACK_INVALID', 'Only Admin and Branch Head roles are allowed');
    }
    const effectiveRole = input.role ?? (await this.adminUsersRepo.getById(input.id))?.role;
    if (effectiveRole === Role.OPS && input.branchId === undefined) {
      const existing = await this.adminUsersRepo.getById(input.id);
      if (!existing?.branchId) {
        throw new AppError('BRANCH_REQUIRED', 'Branch is required for Branch Head role');
      }
    }
    if (effectiveRole === Role.OPS && input.branchId === '') {
      throw new AppError('BRANCH_REQUIRED', 'Branch is required for Branch Head role');
    }
    if (input.isActive === false && input.id === currentUser.id) {
      throw new AppError('CANNOT_DISABLE_SELF', 'You cannot disable your own admin account', {
        userId: currentUser.id,
      });
    }
    return updateAdminUser(input, this.deps);
  }

  async resetPassword(userId: string): Promise<{ tempPassword: string }> {
    const user = await this.adminUsersRepo.getById(userId);
    if (!user) {
      throw new AppError('NOT_FOUND', 'User not found', { userId });
    }
    const tempPassword = generateTempPassword(12);
    await this.adminUsersRepo.setPasswordHash(userId, hashAdminPassword(tempPassword));
    return { tempPassword };
  }

  async delete(userId: string): Promise<void> {
    const user = await this.adminUsersRepo.getById(userId);
    if (!user) {
      throw new AppError('NOT_FOUND', 'User not found', { userId });
    }
    if (user.email === PROTECTED_ADMIN_EMAIL) {
      throw new AppError('CANNOT_DELETE_PROTECTED', 'This user cannot be deleted', {
        email: PROTECTED_ADMIN_EMAIL,
      });
    }
    await this.adminUsersRepo.deleteUser(userId);
  }
}

