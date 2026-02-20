import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class PatchItemDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
