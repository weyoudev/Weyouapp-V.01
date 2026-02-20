import { Module } from '@nestjs/common';
import { FeedbackController } from './feedback.controller';
import { AdminFeedbackController } from './admin-feedback.controller';
import { FeedbackService } from './feedback.service';

@Module({
  controllers: [FeedbackController, AdminFeedbackController],
  providers: [FeedbackService],
  exports: [FeedbackService],
})
export class FeedbackModule {}
