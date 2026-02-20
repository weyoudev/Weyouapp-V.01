export type FeedbackType = 'ORDER' | 'GENERAL';
export type FeedbackStatus = 'NEW' | 'REVIEWED' | 'RESOLVED';

export interface FeedbackRecord {
  id: string;
  userId: string | null;
  orderId: string | null;
  type: FeedbackType;
  rating: number | null;
  tags: string[];
  message: string | null;
  status: FeedbackStatus;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminFeedbackResponse {
  data: FeedbackRecord[];
  nextCursor: string | null;
}
