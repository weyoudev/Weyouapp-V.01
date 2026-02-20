import { IsArray, ValidateNested, IsOptional, IsInt, Min, IsBoolean, IsString, IsNumber, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { InvoiceDraftItemDto } from './invoice-draft-item.dto';

export class InvoiceDraftDto {
  @IsOptional()
  @IsIn(['INDIVIDUAL', 'SUBSCRIPTION_ONLY', 'BOTH'])
  orderMode?: 'INDIVIDUAL' | 'SUBSCRIPTION_ONLY' | 'BOTH';

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceDraftItemDto)
  items!: InvoiceDraftItemDto[];

  @IsOptional()
  @IsInt()
  @Min(0)
  taxPaise?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  discountPaise?: number;

  @IsOptional()
  @IsBoolean()
  subscriptionUtilized?: boolean;

  @IsOptional()
  @IsString()
  subscriptionId?: string | null;

  @IsOptional()
  @IsNumber()
  subscriptionUsageKg?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  subscriptionUsageItems?: number | null;

  /** When using multiple subscriptions for this pickup: list of subscription IDs to deduct 1 pickup + weight/items from each. */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  subscriptionUsageSubscriptionIds?: string[];

  /** New subscription at ACK (for reference/billing); activated only after Final + payment. quantity = multiplier for plan validity (e.g. 2 × 10 days). */
  @IsOptional()
  newSubscription?: { planId: string; validityStartDate: string; quantityMonths?: number } | null;

  /** Multiple new subscriptions on same invoice; each activated only after Final + payment. */
  @IsOptional()
  @IsArray()
  newSubscriptions?: Array<{ planId: string; validityStartDate: string; quantityMonths?: number }> | null;

  @IsOptional()
  @IsString()
  comments?: string | null;
}
