import { IsString, IsEmail, IsIn, IsOptional, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { Role } from '@shared/enums';

const ALLOWED_ROLES = [Role.ADMIN, Role.OPS];

export class CreateAdminUserDto {
  @IsOptional()
  @IsString()
  name?: string | null;

  @IsEmail()
  email!: string;

  @IsIn(ALLOWED_ROLES, { message: 'Only Admin and Branch Head roles are allowed' })
  role!: Role;

  @IsOptional()
  @IsString()
  branchId?: string | null;

  @IsOptional()
  @Transform(({ value }) => (value === 'true' ? true : value === 'false' ? false : value))
  @IsBoolean()
  isActive?: boolean;
}
