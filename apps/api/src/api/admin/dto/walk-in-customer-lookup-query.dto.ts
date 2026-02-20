import { IsString, Matches, MinLength } from 'class-validator';

export class WalkInCustomerLookupQueryDto {
  @IsString()
  @MinLength(10, { message: 'phone must be at least 10 digits' })
  @Matches(/^\d+$/, { message: 'phone must contain only digits' })
  phone: string;
}
