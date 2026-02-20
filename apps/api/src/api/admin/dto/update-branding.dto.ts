import { IsString, IsOptional } from 'class-validator';

export class UpdateBrandingDto {
  @IsString()
  businessName!: string;

  @IsString()
  address!: string;

  @IsString()
  phone!: string;

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
  @IsString()
  panNumber?: string | null;

  @IsOptional()
  @IsString()
  gstNumber?: string | null;

  @IsOptional()
  @IsString()
  email?: string | null;

  @IsOptional()
  @IsString()
  termsAndConditions?: string | null;

  @IsOptional()
  @IsString()
  privacyPolicy?: string | null;
}
