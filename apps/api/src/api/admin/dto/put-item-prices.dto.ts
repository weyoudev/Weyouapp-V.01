import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ItemPriceItemDto } from './item-price-item.dto';

export class PutItemPricesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemPriceItemDto)
  prices!: ItemPriceItemDto[];
}
