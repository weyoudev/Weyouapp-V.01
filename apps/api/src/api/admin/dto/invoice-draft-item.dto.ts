import { IsEnum, IsString, IsInt, Min, IsOptional } from 'class-validator';
import { InvoiceItemType } from '@shared/enums';

export class InvoiceDraftItemDto {
  @IsEnum(InvoiceItemType)
  type!: InvoiceItemType;

  @IsString()
  name!: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsInt()
  @Min(0)
  unitPricePaise!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  amountPaise?: number;

  @IsOptional()
  @IsString()
  catalogItemId?: string | null;

  @IsOptional()
  @IsString()
  segmentCategoryId?: string | null;

  @IsOptional()
  @IsString()
  serviceCategoryId?: string | null;
}
