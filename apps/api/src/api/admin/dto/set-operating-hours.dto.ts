import { IsString, Matches } from 'class-validator';

export class SetOperatingHoursDto {
  @IsString()
  branchId!: string;

  @IsString()
  @Matches(/^\d{1,2}:\d{2}$/, { message: 'startTime must be HH:MM or H:MM (e.g. 09:00)' })
  startTime!: string;

  @IsString()
  @Matches(/^\d{1,2}:\d{2}$/, { message: 'endTime must be HH:MM or H:MM (e.g. 18:00)' })
  endTime!: string;
}
