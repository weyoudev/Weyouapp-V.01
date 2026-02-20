import { IsString, IsBoolean, Matches, IsOptional } from 'class-validator';

export class CreateServiceAreaDto {
  @IsString()
  @Matches(/^\d{6}$/, { message: 'pincode must be 6 digits' })
  pincode!: string;

  @IsString()
  branchId!: string;

  @IsBoolean()
  active!: boolean;
}

export class PatchServiceAreaDto {
  @IsOptional()
  @IsString()
  branchId?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
