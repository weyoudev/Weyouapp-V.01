import { IsOptional, IsPhoneNumber, IsString, Length } from 'class-validator';

export class RequestCustomerOtpDto {
  @IsString()
  @IsPhoneNumber('IN')
  phone!: string;
}

export class VerifyCustomerOtpDto {
  @IsString()
  @IsPhoneNumber('IN')
  phone!: string;

  @IsString()
  @Length(6, 6)
  otp!: string;

  @IsString()
  @IsOptional()
  requestId?: string;
}

