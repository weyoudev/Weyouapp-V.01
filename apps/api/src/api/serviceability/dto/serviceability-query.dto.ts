import { IsString, Matches } from 'class-validator';

export class ServiceabilityQueryDto {
  @IsString()
  @Matches(/^\d{6}$/, { message: 'pincode must be 6 digits' })
  pincode!: string;
}
