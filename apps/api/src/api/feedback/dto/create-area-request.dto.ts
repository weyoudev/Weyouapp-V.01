import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateAreaRequestDto {
  @IsString()
  @MaxLength(20)
  pincode!: string;

  @IsString()
  @MaxLength(1000)
  addressLine!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  customerName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  customerPhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(320)
  customerEmail?: string;
}
