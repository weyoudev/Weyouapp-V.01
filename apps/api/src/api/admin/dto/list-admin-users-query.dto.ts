import { IsEnum, IsOptional, IsString, IsIn } from 'class-validator';
import { Role } from '@shared/enums';

export class ListAdminUsersQueryDto {
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsIn(['true', 'false'])
  active?: 'true' | 'false';

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  limit?: string;

  @IsOptional()
  @IsString()
  cursor?: string;
}
