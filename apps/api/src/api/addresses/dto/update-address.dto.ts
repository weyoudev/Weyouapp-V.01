import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateAddressDto {
  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsString()
  addressLine?: string;

  @IsOptional()
  @IsString()
  pincode?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsString()
  googleMapUrl?: string;

  @IsOptional()
  @IsString()
  houseNo?: string;

  @IsOptional()
  @IsString()
  streetArea?: string;

  @IsOptional()
  @IsString()
  city?: string;
}
