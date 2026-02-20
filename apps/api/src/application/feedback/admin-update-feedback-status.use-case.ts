import { FeedbackStatus } from '@shared/enums';
import { AppError } from '../errors';
import type { FeedbackRepo, FeedbackRecord } from '../ports';

export interface AdminUpdateFeedbackStatusDeps {
  feedbackRepo: FeedbackRepo;
}

export async function adminUpdateFeedbackStatus(
  feedbackId: string,
  status: FeedbackStatus,
  adminNotes: string | null | undefined,
  deps: AdminUpdateFeedbackStatusDeps,
): Promise<FeedbackRecord> {
  const existing = await deps.feedbackRepo.getById(feedbackId);
  if (!existing) {
    throw new AppError('FEEDBACK_NOT_FOUND', 'Feedback not found', { feedbackId });
  }
  return deps.feedbackRepo.updateStatus(
    feedbackId,
    status,
    adminNotes !== undefined ? adminNotes : undefined,
  );
}
