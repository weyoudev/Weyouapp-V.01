import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateSegmentCategoryDto {
  @IsString()
  code!: string;

  @IsString()
  label!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
