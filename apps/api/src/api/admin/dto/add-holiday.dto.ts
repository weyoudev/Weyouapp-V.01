import { IsDateString, IsOptional, IsString } from 'class-validator';

export class AddHolidayDto {
  @IsDateString()
  date!: string; // YYYY-MM-DD

  @IsOptional()
  @IsString()
  label?: string | null;

  /** Omit or null = common holiday for all branches; set = branch-specific. */
  @IsOptional()
  @IsString()
  branchId?: string | null;
}
