import { IsString, IsOptional, MaxLength } from 'class-validator';

export class SyncProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(320)
  email?: string;
}
