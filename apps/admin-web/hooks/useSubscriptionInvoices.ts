import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface AdminSubscriptionInvoiceRow {
  invoiceId: string;
  subscriptionId: string;
  code: string | null;
  total: number;
  issuedAt: string | null;
  paymentStatus: string;
  customerId: string;
  customerName: string | null;
  customerPhone: string | null;
  planName: string;
}

export interface AdminSubscriptionInvoicesResponse {
  data: AdminSubscriptionInvoiceRow[];
  nextCursor: string | null;
}

export interface SubscriptionInvoicesFilters {
  customerId?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  cursor?: string;
}

function fetchSubscriptionInvoices(filters: SubscriptionInvoicesFilters): Promise<AdminSubscriptionInvoicesResponse> {
  const params = new URLSearchParams();
  if (filters.customerId) params.set('customerId', filters.customerId);
  if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
  if (filters.dateTo) params.set('dateTo', filters.dateTo);
  params.set('limit', String(filters.limit ?? 50));
  if (filters.cursor) params.set('cursor', filters.cursor);

  return api.get<AdminSubscriptionInvoicesResponse>(`/admin/subscriptions/invoices?${params.toString()}`).then((r) => r.data);
}

export function useSubscriptionInvoices(filters: SubscriptionInvoicesFilters) {
  return useQuery({
    queryKey: ['admin', 'subscriptions', 'invoices', filters],
    queryFn: () => fetchSubscriptionInvoices(filters),
  });
}

export interface SubscriptionDetailOrder {
  id: string;
  status: string;
  pickupDate: string;
  timeWindow: string;
  serviceType: string;
  createdAt: string;
}

export interface SubscriptionDetailResponse {
  subscriptionId: string;
  subscription: {
    id: string;
    userId: string;
    planId: string;
    validityStartDate: string;
    expiryDate: string;
    active: boolean;
    remainingPickups: number;
    usedKg: number;
    usedItemsCount: number;
  };
  invoice: {
    id: string;
    code: string | null;
    total: number;
    paymentStatus: string;
    issuedAt: string | null;
  };
  payment: {
    provider: string;
    status: string;
    amount: number;
    updatedAt: string;
  } | null;
  planName: string | null;
  customerName: string | null;
  customerPhone: string | null;
  orders: SubscriptionDetailOrder[];
}

function fetchSubscriptionDetail(subscriptionId: string): Promise<SubscriptionDetailResponse> {
  return api.get<SubscriptionDetailResponse>(`/admin/subscriptions/${subscriptionId}/detail`).then((r) => r.data);
}

export function useSubscriptionDetail(subscriptionId: string | null) {
  return useQuery({
    queryKey: ['admin', 'subscriptions', subscriptionId, 'detail'],
    queryFn: () => fetchSubscriptionDetail(subscriptionId!),
    enabled: !!subscriptionId,
  });
}

export interface ConfirmSubscriptionPaymentDto {
  provider: string;
  status: string;
  amountPaise: number;
}

function confirmSubscriptionPayment(subscriptionId: string, dto: ConfirmSubscriptionPaymentDto): Promise<SubscriptionDetailResponse> {
  return api.patch<SubscriptionDetailResponse>(`/admin/subscriptions/${subscriptionId}/payment`, dto).then((r) => r.data);
}

export function useConfirmSubscriptionPayment(subscriptionId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: ConfirmSubscriptionPaymentDto) => confirmSubscriptionPayment(subscriptionId!, dto),
    onSuccess: () => {
      if (subscriptionId) {
        queryClient.invalidateQueries({ queryKey: ['admin', 'subscriptions', subscriptionId, 'detail'] });
        queryClient.invalidateQueries({ queryKey: ['admin', 'subscriptions', subscriptionId, 'invoice'] });
        queryClient.invalidateQueries({ queryKey: ['admin', 'subscriptions', 'invoices'] });
      }
    },
  });
}

/** Full subscription invoice (for display / PDF link). */
export interface SubscriptionInvoiceResponse {
  id: string;
  subscriptionId: string;
  code: string | null;
  subtotal: number;
  tax: number;
  total: number;
  discountPaise: number;
  issuedAt: string | null;
  pdfUrl: string | null;
  paymentStatus: string;
  items: Array<{ name?: string; quantity?: number; amount?: number }>;
  planName: string | null;
  customerName: string | null;
  customerPhone: string | null;
}

function fetchSubscriptionInvoice(subscriptionId: string): Promise<SubscriptionInvoiceResponse> {
  return api.get<SubscriptionInvoiceResponse>(`/admin/subscriptions/${subscriptionId}/invoice`).then((r) => r.data);
}

export function useSubscriptionInvoice(subscriptionId: string | null) {
  return useQuery({
    queryKey: ['admin', 'subscriptions', subscriptionId, 'invoice'],
    queryFn: () => fetchSubscriptionInvoice(subscriptionId!),
    enabled: !!subscriptionId,
  });
}
