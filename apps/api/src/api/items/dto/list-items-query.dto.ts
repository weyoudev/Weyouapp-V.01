import { IsEnum } from 'class-validator';
import { ServiceType } from '@shared/enums';

export class ListItemsQueryDto {
  @IsEnum(ServiceType)
  serviceType!: ServiceType;
}
