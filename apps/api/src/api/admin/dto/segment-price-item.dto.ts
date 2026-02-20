import { IsString, IsInt, Min, IsBoolean, IsOptional } from 'class-validator';

export class SegmentPriceItemDto {
  @IsString()
  segmentCategoryId!: string;

  @IsString()
  serviceCategoryId!: string;

  @IsInt()
  @Min(0)
  priceRupees!: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
