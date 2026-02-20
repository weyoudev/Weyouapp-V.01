import { IsEmail, IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class CreateWalkInCustomerDto {
  @IsString()
  @MinLength(10, { message: 'phone must be at least 10 digits' })
  @Matches(/^\d+$/, { message: 'phone must contain only digits' })
  phone: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}
