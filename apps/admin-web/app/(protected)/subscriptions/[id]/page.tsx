'use client';

import { useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  useSubscriptionDetail,
  useConfirmSubscriptionPayment,
  useSubscriptionInvoice,
} from '@/hooks/useSubscriptionInvoices';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { formatMoney, formatDate } from '@/lib/format';
import { ErrorDisplay } from '@/components/shared/ErrorDisplay';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileCheck, FileText, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { getFriendlyErrorMessage } from '@/lib/api';

const PAYMENT_PROVIDERS = ['UPI', 'CARD', 'CASH', 'RAZORPAY', 'NONE'] as const;

export default function SubscriptionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const subscriptionId = params.id as string;
  const { data, isLoading, error } = useSubscriptionDetail(subscriptionId);
  const { data: invoiceData } = useSubscriptionInvoice(subscriptionId);
  const confirmPayment = useConfirmSubscriptionPayment(subscriptionId);

  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentProvider, setPaymentProvider] = useState<string>('UPI');
  const [paymentAmountRupees, setPaymentAmountRupees] = useState<string>('');

  const invoicePaid = data?.invoice?.paymentStatus === 'PAID' || data?.invoice?.paymentStatus === 'CAPTURED';
  const firstOrderId = data?.orders?.length ? data.orders[0].id : null;
  const customerId = data?.subscription?.userId ?? null;
  const activeOrders = (data?.orders ?? []).filter((o) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED');
  const completedOrders = (data?.orders ?? []).filter((o) => o.status === 'DELIVERED' || o.status === 'CANCELLED');

  const handleConfirmPayment = useCallback(async () => {
    const amount = Math.round(parseFloat(paymentAmountRupees || '0') * 100);
    if (amount <= 0) {
      toast.error('Enter a valid amount in rupees');
      return;
    }
    try {
      await confirmPayment.mutateAsync({
        provider: paymentProvider,
        status: 'CAPTURED',
        amountPaise: amount,
      });
      toast.success('Payment confirmed');
      setPaymentDialogOpen(false);
      setPaymentAmountRupees('');
    } catch (e) {
      toast.error(getFriendlyErrorMessage(e));
    }
  }, [paymentProvider, paymentAmountRupees, confirmPayment]);

  if (error) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/subscriptions">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Subscriptions
          </Link>
        </Button>
        <p className="text-sm text-destructive">Failed to load subscription.</p>
        <ErrorDisplay error={error} className="mt-2" />
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/subscriptions">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Subscriptions
          </Link>
        </Button>
      </div>

      {/* Subscription invoice – admin can view invoice and record payment when due */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Subscription invoice
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Invoice and payment for this subscription. After confirming payment, you can issue the acknowledgement invoice for the first order linked below.
            </p>
          </div>
          {invoiceData?.pdfUrl && (
            <Button variant="outline" size="sm" asChild>
              <a href={invoiceData.pdfUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-1 h-3 w-3" />
                View invoice (PDF)
              </a>
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {!invoicePaid && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
              <strong>Payment due.</strong> Record payment below when the customer has paid (UPI, Card, Cash, etc.).
            </div>
          )}
          <div className="grid gap-2 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">Invoice number:</span>
              <span className="font-mono">{data.invoice.code ?? data.subscriptionId}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">Customer:</span>
              <span>{data.customerName ?? data.customerPhone ?? data.subscription.userId}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">Plan:</span>
              <span>{data.planName ?? '—'}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">Total:</span>
              <span>{formatMoney(data.invoice.total)}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">Payment status:</span>
              <Badge
                variant={
                  invoicePaid ? 'default' : data.invoice.paymentStatus === 'DUE' || data.invoice.paymentStatus === 'PENDING' ? 'secondary' : 'destructive'
                }
              >
                {invoicePaid ? 'Paid' : (data.invoice.paymentStatus ?? 'DUE')}
              </Badge>
              {!invoicePaid && (
                <Button
                  size="sm"
                  onClick={() => {
                    setPaymentAmountRupees(String((data.invoice.total / 100).toFixed(2)));
                    setPaymentDialogOpen(true);
                  }}
                >
                  Record payment
                </Button>
              )}
            </div>
            {data.invoice.issuedAt && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">Issued:</span>
                <span>{formatDate(data.invoice.issuedAt)}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Orders linked to this subscription</CardTitle>
          <p className="text-sm text-muted-foreground">
            All orders booked from this subscription. Issue the acknowledgement invoice for the first order only after the subscription payment is confirmed above.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          {!data.orders?.length ? (
            <div className="p-6 text-center text-muted-foreground">No orders yet.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Pickup</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.orders.map((order, index) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-xs">
                      #{order.id.slice(0, 8)}…
                      {index === 0 && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          First order
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(order.pickupDate)}</TableCell>
                    <TableCell>{order.timeWindow}</TableCell>
                    <TableCell>{order.serviceType}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{order.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/orders/${order.id}`}>View order</Link>
                      </Button>
                      {index === 0 && invoicePaid && (
                        <Button variant="outline" size="sm" asChild className="ml-1">
                          <Link href={`/orders/${order.id}`}>
                            <FileCheck className="mr-1 h-3 w-3" />
                            Issue ACK
                          </Link>
                        </Button>
                      )}
                      {index === 0 && !invoicePaid && (
                        <span className="text-xs text-muted-foreground ml-1">
                          Confirm subscription payment above to enable Issue ACK
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm subscription payment</DialogTitle>
            <DialogDescription>
              Record that the customer paid for this subscription (UPI, Card, Cash, etc.). This will set the invoice status to Paid and allow you to issue the acknowledgement invoice for the first order.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Payment method</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={paymentProvider}
                onChange={(e) => setPaymentProvider(e.target.value)}
              >
                {PAYMENT_PROVIDERS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Amount (₹)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={paymentAmountRupees}
                onChange={(e) => setPaymentAmountRupees(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmPayment}
              disabled={confirmPayment.isPending || !paymentAmountRupees}
            >
              {confirmPayment.isPending ? 'Saving…' : 'Confirm payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
