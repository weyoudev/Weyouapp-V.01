import { IsInt, IsOptional, IsArray, IsString, Max, Min } from 'class-validator';

export class CreateGeneralFeedbackDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  message?: string;
}
