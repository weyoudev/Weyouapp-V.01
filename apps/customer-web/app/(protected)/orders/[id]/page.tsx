'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useOrder } from '@/hooks/use-orders';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function OrderDetailPage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : null;
  const { data: order, isLoading, error } = useOrder(id);

  if (isLoading || !id) {
    return (
      <div className="min-h-screen bg-muted/30 p-4">
        <Skeleton className="h-64 w-full max-w-lg" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-muted/30 p-4">
        <Card className="max-w-lg">
          <CardContent className="pt-6">
            <p className="text-destructive">Order not found or access denied.</p>
            <Link href="/orders" className={cn(buttonVariants({ variant: 'outline' }), 'mt-4')}>
              Back to orders
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const canFeedback =
    order.status === 'DELIVERED' &&
    (order.paymentStatus === 'CAPTURED' || order.paymentStatus === 'PAID');

  return (
    <div className="min-h-screen bg-muted/30 p-4">
      <header className="mb-6">
        <Link href="/orders" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}>
          ← Orders
        </Link>
      </header>
      <Card className="mx-auto max-w-lg">
        <CardHeader>
          <CardTitle>Order {order.id.slice(0, 8)}…</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Status:</span> {order.status}
          </p>
          <p>
            <span className="text-muted-foreground">Service:</span> {order.serviceType}
          </p>
          <p>
            <span className="text-muted-foreground">Pickup:</span> {order.pickupDate} ·{' '}
            {order.timeWindow}
          </p>
          <p>
            <span className="text-muted-foreground">Pincode:</span> {order.pincode}
          </p>
          <p>
            <span className="text-muted-foreground">Payment:</span> {order.paymentStatus}
          </p>
          <p>
            <span className="text-muted-foreground">Created:</span> {order.createdAt}
          </p>
          {canFeedback && (
            <div className="pt-4">
              <Link href={`/orders/${order.id}/feedback`} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
                Submit feedback
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
