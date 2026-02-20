import { FeedbackType } from '@shared/enums';
import { AppError } from '../errors';
import type { FeedbackRepo, FeedbackRecord } from '../ports';

const MIN_RATING = 1;
const MAX_RATING = 5;

export interface CreateGeneralFeedbackInput {
  userId: string;
  rating?: number | null;
  tags?: string[];
  message?: string | null;
}

export interface CreateGeneralFeedbackDeps {
  feedbackRepo: FeedbackRepo;
}

export async function createGeneralFeedback(
  input: CreateGeneralFeedbackInput,
  deps: CreateGeneralFeedbackDeps,
): Promise<FeedbackRecord> {
  if (input.rating != null && (input.rating < MIN_RATING || input.rating > MAX_RATING)) {
    throw new AppError('FEEDBACK_INVALID', `Rating must be between ${MIN_RATING} and ${MAX_RATING}`, {
      rating: input.rating,
    });
  }

  return deps.feedbackRepo.create({
    userId: input.userId,
    orderId: null,
    type: FeedbackType.GENERAL,
    rating: input.rating ?? null,
    tags: input.tags ?? [],
    message: input.message ?? null,
  });
}
