import { IsEnum, IsInt, Min, IsOptional, IsBoolean } from 'class-validator';
import { ServiceType } from '@shared/enums';

export class ItemPriceItemDto {
  @IsEnum(ServiceType)
  serviceType!: ServiceType;

  @IsInt()
  @Min(0)
  unitPricePaise!: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
