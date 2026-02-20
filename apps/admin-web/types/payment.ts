export type PaymentProvider = 'RAZORPAY' | 'CASH' | 'UPI' | 'CARD' | 'NONE';
export type PaymentStatus = 'PENDING' | 'CAPTURED' | 'FAILED';

export interface UpdatePaymentBody {
  provider: PaymentProvider;
  status: PaymentStatus;
  amountPaise: number;
  note?: string;
}
