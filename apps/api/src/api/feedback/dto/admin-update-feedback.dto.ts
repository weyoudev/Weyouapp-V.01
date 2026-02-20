import { IsEnum, IsOptional, IsString } from 'class-validator';
import { FeedbackStatus } from '@shared/enums';

export class AdminUpdateFeedbackDto {
  @IsEnum(FeedbackStatus)
  status!: FeedbackStatus;

  @IsOptional()
  @IsString()
  adminNotes?: string;
}
