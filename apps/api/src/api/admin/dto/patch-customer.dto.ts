import { IsOptional, IsString } from 'class-validator';

export class PatchCustomerDto {
  @IsOptional()
  @IsString()
  name?: string | null;

  @IsOptional()
  @IsString()
  email?: string | null;

  @IsOptional()
  @IsString()
  notes?: string | null;
}
