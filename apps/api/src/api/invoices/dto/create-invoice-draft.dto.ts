import { IsArray, IsEnum, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { InvoiceItemType } from '@shared/enums';

export class InvoiceItemDto {
  @IsEnum(InvoiceItemType)
  type!: InvoiceItemType;

  @IsString()
  name!: string;

  @IsNumber()
  quantity!: number;

  @IsNumber()
  unitPrice!: number;

  @IsOptional()
  @IsNumber()
  amount?: number;
}

export class CreateInvoiceDraftDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  items!: InvoiceItemDto[];

  @IsOptional()
  @IsNumber()
  tax?: number;
}

