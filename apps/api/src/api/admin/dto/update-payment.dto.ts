import { IsEnum, IsInt, Min, IsOptional, IsString } from 'class-validator';
import { PaymentProvider, PaymentStatus } from '@shared/enums';

export class UpdatePaymentDto {
  @IsEnum(PaymentProvider)
  provider!: PaymentProvider;

  @IsEnum(PaymentStatus)
  status!: PaymentStatus;

  @IsInt()
  @Min(0)
  amountPaise!: number;

  @IsOptional()
  @IsString()
  note?: string;
}
