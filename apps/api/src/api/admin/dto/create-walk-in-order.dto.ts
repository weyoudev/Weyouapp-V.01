import { IsString, IsUUID, MinLength } from 'class-validator';

export class CreateWalkInOrderDto {
  @IsString()
  @IsUUID()
  userId: string;

  @IsString()
  @MinLength(1, { message: 'branchId is required' })
  branchId: string;
}
