import {
  IsString,
  IsEnum,
  IsIn,
  IsInt,
  Min,
  IsOptional,
  IsBoolean,
  IsArray,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SubscriptionVariant, RedemptionMode } from '@shared/enums';

const REDEMPTION_MODE_VALUES: RedemptionMode[] = ['MULTI_USE', 'SINGLE_USE'];

export class CreateSubscriptionPlanDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsIn(REDEMPTION_MODE_VALUES)
  redemptionMode?: RedemptionMode;

  @IsEnum(SubscriptionVariant)
  variant!: SubscriptionVariant;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  validityDays!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxPickups!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  kgLimit?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  itemsLimit?: number | null;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  pricePaise!: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applicableServiceTypes?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  branchIds?: string[];
}

