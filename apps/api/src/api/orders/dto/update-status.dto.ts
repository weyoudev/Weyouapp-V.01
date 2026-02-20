import { IsEnum, IsOptional, IsString } from 'class-validator';
import { OrderStatus } from '@shared/enums';

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  status!: OrderStatus;

  /** Required when status is CANCELLED (reason for cancellation). */
  @IsOptional()
  @IsString()
  reason?: string;
}

