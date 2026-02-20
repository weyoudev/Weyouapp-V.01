'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RoleGate } from '@/components/shared/RoleGate';
import { EmptyState } from '@/components/ui/empty-state';
import { formatDate } from '@/lib/format';
import { useSubscriptionOrders } from '@/hooks/useCustomers';
import type { CustomerRecord } from '@/types';
import type { Role } from '@/lib/auth';
import { Settings2, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { SubscriptionOverrideModal } from './SubscriptionOverrideModal';
import { cn } from '@/lib/utils';

export interface CustomerSubscriptionCardProps {
  customer: CustomerRecord;
  role: Role;
}

export function CustomerSubscriptionCard({ customer, role }: CustomerSubscriptionCardProps) {
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const activeList = customer.activeSubscriptions ?? (customer.subscription ? [customer.subscription] : []);
  const pastList = customer.pastSubscriptions ?? [];
  const primarySub = activeList[0] ?? customer.subscription ?? null;

  const { data: subscriptionOrdersList } = useSubscriptionOrders(customer.id);
  const ordersBySubscription = new Map<string, string[]>();
  for (const item of subscriptionOrdersList ?? []) {
    ordersBySubscription.set(item.subscriptionId, item.orderIds);
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Subscriptions</CardTitle>
          {primarySub && (
            <RoleGate role={role} gate="customersEdit">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOverrideModalOpen(true)}
              >
                <Settings2 className="mr-2 h-4 w-4" />
                Override subscription
              </Button>
            </RoleGate>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {activeList.length > 0 ? (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Active ({activeList.length})</h4>
              <ul className="space-y-3">
                {activeList.map((sub) => (
                  <li key={sub.id} className="rounded-md border border-border bg-muted/20 p-3 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{sub.planName}</span>
                        {sub.addressLabel && (
                          <Badge variant="secondary" className="font-normal">{sub.addressLabel}</Badge>
                        )}
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/subscriptions/${sub.id}`} className="inline-flex items-center gap-1">
                          <ExternalLink className="h-3.5 w-3.5" />
                          Subscription page
                        </Link>
                      </Button>
                    </div>
                    <SubscriptionRow label="Plan" value={sub.planName} />
                    <SubscriptionRow label="Status" value="Active" />
                    <SubscriptionRow label="Expiry" value={formatDate(sub.expiryDate)} />
                    <SubscriptionRow label="Remaining pickups" value={`${sub.remainingPickups}${sub.maxPickups != null ? ` / ${sub.maxPickups}` : ''}`} />
                    <SubscriptionRow label="Used kg" value={sub.kgLimit != null ? `${sub.usedKg} / ${sub.kgLimit}` : String(sub.usedKg)} />
                    <SubscriptionRow label="Used items" value={sub.itemsLimit != null ? `${sub.usedItemsCount} / ${sub.itemsLimit}` : String(sub.usedItemsCount)} />
                    <SubscriptionOrderChips orderIds={ordersBySubscription.get(sub.id) ?? []} />
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <EmptyState title="No active subscription" description="This customer has no active subscription." />
          )}

          {pastList.length > 0 && (
            <div className="space-y-3 border-t pt-4">
              <h4 className="text-sm font-medium text-muted-foreground">Past ({pastList.length})</h4>
              <ul className="space-y-3">
                {pastList.map((sub) => {
                  const totalPickups = sub.maxPickups ?? 0;
                  const completedPickups = sub.usedPickups ?? (sub.maxPickups != null ? sub.maxPickups - sub.remainingPickups : 0);
                  const pickupsValue = `${completedPickups} / ${totalPickups}`;
                  const actualExpiryDate = sub.inactivatedAt ?? sub.expiryDate;
                  return (
                    <li key={sub.id} className="rounded-md border border-border/60 bg-muted/10 p-3 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">{sub.planName}</p>
                          {sub.addressLabel && (
                            <Badge variant="secondary" className="font-normal">{sub.addressLabel}</Badge>
                          )}
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/subscriptions/${sub.id}`} className="inline-flex items-center gap-1">
                            <ExternalLink className="h-3.5 w-3.5" />
                            Subscription page
                          </Link>
                        </Button>
                      </div>
                      <div className="space-y-1 text-muted-foreground">
                        <SubscriptionRow label="Completed pickups (as per plan)" value={pickupsValue} />
                        {sub.kgLimit != null && (
                          <SubscriptionRow label="Utilised kg" value={`${sub.usedKg} / ${sub.kgLimit}`} />
                        )}
                        {sub.itemsLimit != null && (
                          <SubscriptionRow label="Utilised items" value={`${sub.usedItemsCount} / ${sub.itemsLimit}`} />
                        )}
                        {sub.validityStartDate && (
                          <SubscriptionRow label="Validity period" value={`${formatDate(sub.validityStartDate)} – ${formatDate(sub.expiryDate)}`} />
                        )}
                        <SubscriptionRow label="Actual expired date" value={formatDate(actualExpiryDate)} />
                      </div>
                      <SubscriptionOrderChips orderIds={ordersBySubscription.get(sub.id) ?? []} />
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {primarySub && (
        <SubscriptionOverrideModal
          userId={customer.id}
          subscription={primarySub}
          open={overrideModalOpen}
          onOpenChange={setOverrideModalOpen}
        />
      )}
    </>
  );
}

function SubscriptionRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}

function SubscriptionOrderChips({ orderIds }: { orderIds: string[] }) {
  return (
    <div className="mt-2 pt-2 border-t border-border/60">
      <p className="text-xs text-muted-foreground mb-1.5">Orders</p>
      {orderIds.length === 0 ? (
        <p className="text-xs text-muted-foreground">No orders</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {orderIds.map((orderId, index) => (
            <Link
              key={orderId}
              href={`/orders/${orderId}`}
              className={cn(
                'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
                'bg-primary/10 text-primary hover:bg-primary/20 transition-colors'
              )}
            >
              Order {index + 1}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
