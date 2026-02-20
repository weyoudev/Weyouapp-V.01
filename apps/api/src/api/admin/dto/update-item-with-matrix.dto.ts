import { IsArray, IsOptional, IsString, IsBoolean, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { SegmentPriceItemDto } from './segment-price-item.dto';

export class UpdateItemWithMatrixDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  branchIds?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SegmentPriceItemDto)
  segmentPrices!: SegmentPriceItemDto[];
}
