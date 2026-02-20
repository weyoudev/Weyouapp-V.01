import type { FeedbackRepo, FeedbackRecord } from '../ports';

export interface ListCustomerFeedbackDeps {
  feedbackRepo: FeedbackRepo;
}

export async function listCustomerFeedback(
  userId: string,
  deps: ListCustomerFeedbackDeps,
): Promise<FeedbackRecord[]> {
  return deps.feedbackRepo.listForCustomer(userId);
}
