'use client';

import Link from 'next/link';
import { useOrders } from '@/hooks/use-orders';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { logout } from '@/lib/auth';

export default function OrdersPage() {
  const { data: orders, isLoading, error } = useOrders();

  return (
    <div className="min-h-screen bg-muted/30 p-4">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">My orders</h1>
        <div className="flex gap-2">
          <Link href="/addresses" className={cn(buttonVariants({ variant: 'outline' }))}>
            Addresses
          </Link>
          <Link href="/create-order" className={cn(buttonVariants({ variant: 'outline' }))}>
            Create order
          </Link>
          <Button variant="secondary" onClick={logout}>
            Logout
          </Button>
        </div>
      </header>

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      )}
      {error && (
        <p className="text-sm text-destructive">
          Failed to load orders. Check API and try again.
        </p>
      )}
      {orders && orders.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>No orders yet</CardTitle>
            <CardDescription>Create your first order to get started.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/create-order" className={cn(buttonVariants())}>
              Create order
            </Link>
          </CardContent>
        </Card>
      )}
      {orders && orders.length > 0 && (
        <ul className="space-y-3">
          {orders.map((o) => (
            <li key={o.id}>
              <Card>
                <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
                  <div>
                    <p className="font-medium">
                      Order {o.id.slice(0, 8)}… · {o.serviceType}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {o.pickupDate} · {o.timeWindow} · {o.status}
                    </p>
                  </div>
                  <Link href={`/orders/${o.id}`} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
                    View
                  </Link>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
