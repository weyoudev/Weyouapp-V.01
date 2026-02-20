import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateBranchDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  phone?: string | null;

  @IsOptional()
  @IsString()
  email?: string | null;

  @IsOptional()
  @IsString()
  gstNumber?: string | null;

  @IsOptional()
  @IsString()
  panNumber?: string | null;

  @IsOptional()
  @IsString()
  footerNote?: string | null;

  @IsOptional()
  @IsString()
  upiId?: string | null;

  @IsOptional()
  @IsString()
  upiPayeeName?: string | null;

  @IsOptional()
  @IsString()
  upiLink?: string | null;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
