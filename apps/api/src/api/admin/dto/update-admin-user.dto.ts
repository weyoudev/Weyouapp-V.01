import { IsString, IsIn, IsOptional, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { Role } from '@shared/enums';

const ALLOWED_ROLES = [Role.ADMIN, Role.OPS];

export class UpdateAdminUserDto {
  @IsOptional()
  @IsString()
  name?: string | null;

  @IsOptional()
  @IsIn(ALLOWED_ROLES, { message: 'Only Admin and Branch Head roles are allowed' })
  role?: Role;

  @IsOptional()
  @IsString()
  branchId?: string | null;

  @IsOptional()
  @Transform(({ value }) => (value === 'true' ? true : value === 'false' ? false : value))
  @IsBoolean()
  isActive?: boolean;
}
