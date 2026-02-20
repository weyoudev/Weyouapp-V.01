import { IsDateString, IsOptional, IsString } from 'class-validator';

export class PatchHolidayDto {
  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  label?: string | null;

  /** null = common for all branches; string = branch-specific */
  @IsOptional()
  @IsString()
  branchId?: string | null;
}
