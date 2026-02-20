import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateServiceCategoryDto {
  @IsString()
  code!: string;

  @IsString()
  label!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
