import { IsOptional, IsString, IsBoolean } from 'class-validator';

export class PatchServiceCategoryDto {
  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
