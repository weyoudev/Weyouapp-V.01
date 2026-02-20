import { IsString, IsOptional, IsEmail, MaxLength } from 'class-validator';

export class UpdateMeDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsString()
  @IsEmail()
  @MaxLength(320)
  email?: string;
}
