import type { FeedbackRepo, AdminFeedbackFilters, AdminFeedbackResult } from '../ports';

export interface AdminListFeedbackDeps {
  feedbackRepo: FeedbackRepo;
}

export async function adminListFeedback(
  filters: AdminFeedbackFilters,
  deps: AdminListFeedbackDeps,
): Promise<AdminFeedbackResult> {
  return deps.feedbackRepo.listAdmin(filters);
}
