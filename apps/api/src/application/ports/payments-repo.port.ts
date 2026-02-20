import type { PaymentProvider } from '@shared/enums';
import type { PaymentStatus } from '@shared/enums';

export interface PaymentRecord {
  id: string;
  orderId: string | null;
  subscriptionId: string | null;
  provider: PaymentProvider;
  status: PaymentStatus;
  amount: number;
  providerPaymentId: string | null;
  providerOrderId: string | null;
  failureReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpsertPaymentInput {
  orderId: string;
  provider: PaymentProvider;
  status: PaymentStatus;
  amount: number;
  providerPaymentId?: string | null;
  providerOrderId?: string | null;
  failureReason?: string | null;
}

export interface UpsertSubscriptionPaymentInput {
  subscriptionId: string;
  provider: PaymentProvider;
  status: PaymentStatus;
  amount: number;
  providerPaymentId?: string | null;
  providerOrderId?: string | null;
}

export interface PaymentsRepo {
  upsertForOrder(input: UpsertPaymentInput): Promise<PaymentRecord>;
  upsertForSubscription(input: UpsertSubscriptionPaymentInput): Promise<PaymentRecord>;
  getByOrderId(orderId: string): Promise<PaymentRecord | null>;
  getBySubscriptionId(subscriptionId: string): Promise<PaymentRecord | null>;
  /** List all payments for orders belonging to this customer (userId). For customer profile "Previous Payments". */
  listByUserId(userId: string): Promise<PaymentRecord[]>;
}
