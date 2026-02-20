import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateAddressDto {
  @IsString()
  label!: string;

  @IsString()
  addressLine!: string;

  @IsString()
  pincode!: string;

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
