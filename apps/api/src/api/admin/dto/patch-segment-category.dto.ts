import { IsOptional, IsString, IsBoolean } from 'class-validator';

export class PatchSegmentCategoryDto {
  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
