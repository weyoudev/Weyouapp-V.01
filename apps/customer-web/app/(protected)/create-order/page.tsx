'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMe } from '@/hooks/use-me';
import { useAddresses } from '@/hooks/use-addresses';
import { useCreateOrder } from '@/hooks/use-orders';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TIME_SLOT_OPTIONS, DEFAULT_TIME_SLOT } from '@/lib/time-slots';

const BOOKABLE_SERVICES = [
  'WASH_FOLD',
  'WASH_IRON',
  'STEAM_IRON',
  'DRY_CLEAN',
  'HOME_LINEN',
  'SHOES',
  'ADD_ONS',
] as const;

type OrderType = 'INDIVIDUAL' | 'SUBSCRIPTION';

const defaultDate = () => new Date().toISOString().slice(0, 10);

export default function CreateOrderPage() {
  const router = useRouter();
  const { data: me, isLoading: meLoading } = useMe();
  const { data: addresses, isLoading: addressesLoading } = useAddresses();
  const createOrder = useCreateOrder();

  const [orderType, setOrderType] = useState<OrderType>('INDIVIDUAL');
  const [selectedServices, setSelectedServices] = useState<string[]>(['WASH_FOLD']);
  const [addressId, setAddressId] = useState('');
  const [pickupDate, setPickupDate] = useState(defaultDate);
  const [timeWindow, setTimeWindow] = useState(DEFAULT_TIME_SLOT);
  const [estimatedWeightKg, setEstimatedWeightKg] = useState<string>('');
  /** When SUBSCRIPTION: customer must select one subscription (order is dedicated to that subscription). */
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const activeSubscriptions = me?.activeSubscriptions ?? [];
  const availableSubscriptions = activeSubscriptions.filter((s) => !s.hasActiveOrder);
  const sub = activeSubscriptions.length === 1 && !activeSubscriptions[0]?.hasActiveOrder ? activeSubscriptions[0]! : activeSubscriptions.find((s) => s.id === selectedSubscriptionId && !s.hasActiveOrder) ?? null;
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const isToday = pickupDate === today;
  const currentMinutes = typeof window !== 'undefined' ? new Date().getHours() * 60 + new Date().getMinutes() : 0;
  const timeSlotOptions = useMemo(() => {
    if (!isToday) return TIME_SLOT_OPTIONS;
    return TIME_SLOT_OPTIONS.filter((opt) => {
      const [start] = opt.value.split('-');
      const [h, m] = start.split(':').map(Number);
      const slotStartMinutes = h * 60 + m;
      return slotStartMinutes > currentMinutes;
    });
  }, [isToday, currentMinutes]);

  useEffect(() => {
    if (!addresses?.length) return;
    const defaultAddr = addresses.find((a) => a.isDefault) ?? addresses[0];
    if (!addressId || !addresses.some((a) => a.id === addressId)) setAddressId(defaultAddr?.id ?? '');
  }, [addresses, addressId]);

  useEffect(() => {
    if (orderType === 'SUBSCRIPTION' && availableSubscriptions.length === 1 && !selectedSubscriptionId) {
      setSelectedSubscriptionId(availableSubscriptions[0]!.id);
    }
    if (orderType === 'INDIVIDUAL') setSelectedSubscriptionId('');
    if (orderType === 'SUBSCRIPTION' && selectedSubscriptionId && activeSubscriptions.some((s) => s.id === selectedSubscriptionId && s.hasActiveOrder)) {
      setSelectedSubscriptionId('');
    }
  }, [orderType, activeSubscriptions, availableSubscriptions, selectedSubscriptionId]);

  useEffect(() => {
    if (isToday && timeSlotOptions.length > 0 && !timeSlotOptions.some((o) => o.value === timeWindow)) {
      setTimeWindow(timeSlotOptions[0]!.value);
    }
  }, [isToday, timeSlotOptions, timeWindow]);

  const needsServices = orderType === 'INDIVIDUAL';
  const canSubmit =
    !!addressId &&
    (!needsServices || selectedServices.length > 0) &&
    (orderType !== 'SUBSCRIPTION' || (!!sub && !!selectedSubscriptionId && activeSubscriptions.some((s) => s.id === selectedSubscriptionId && !s.hasActiveOrder))) &&
    (!isToday || timeSlotOptions.length > 0);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError(null);
    if (!canSubmit) {
      if (orderType === 'SUBSCRIPTION' && activeSubscriptions.length === 0) {
        setValidationError('Purchase a subscription from your profile first to book a subscription order.');
      } else if (orderType === 'SUBSCRIPTION' && !selectedSubscriptionId) {
        setValidationError('Select one subscription to use for this order.');
      } else {
        setValidationError(
          needsServices
            ? 'Select at least one service and an address.'
            : 'Select an address.'
        );
      }
      return;
    }
    const timeSlot = timeSlotOptions.some((o) => o.value === timeWindow) ? timeWindow : timeSlotOptions[0]?.value ?? timeWindow;
    const base = { addressId, pickupDate: new Date(pickupDate).toISOString(), timeWindow: timeSlot };
    const payload =
      orderType === 'INDIVIDUAL'
        ? { ...base, orderType: 'INDIVIDUAL' as const, selectedServices, estimatedWeightKg: estimatedWeightKg ? Number(estimatedWeightKg) : undefined }
        : {
            ...base,
            orderType: 'SUBSCRIPTION' as const,
            subscriptionId: selectedSubscriptionId,
          };
    createOrder.mutate(payload, {
      onSuccess: (data) => {
        router.push(`/orders/${data.orderId}`);
      },
    });
  }

  if (meLoading || !me || addressesLoading) {
    return (
      <div className="min-h-screen bg-muted/30 p-4">
        <Skeleton className="mx-auto h-96 max-w-md" />
      </div>
    );
  }

  if (!addresses?.length) {
    return (
      <div className="min-h-screen bg-muted/30 p-4">
        <Card className="mx-auto max-w-md">
          <CardHeader>
            <CardTitle>No address</CardTitle>
            <CardDescription>
              Add an address (Home, Office, Friends Place, or Other) to create an order.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Link href="/addresses" className={cn(buttonVariants())}>
              Add address
            </Link>
            <Link href="/orders" className={cn(buttonVariants({ variant: 'outline' }))}>
              Back to orders
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 p-4">
      <header className="mb-6">
        <Link href="/orders" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}>
          ← Orders
        </Link>
      </header>

      <div className="mx-auto max-w-md space-y-4">
        {/* Active subscriptions summary – customer picks one for this order */}
        {activeSubscriptions.length > 0 && (
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Your active subscriptions</CardTitle>
              <CardDescription>
                {activeSubscriptions.length === 1
                  ? 'This plan will be used for the subscription order below.'
                  : 'Select one subscription for this order. Each order is dedicated to one plan.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {activeSubscriptions.map((s) => {
                const hasActiveOrder = !!s.hasActiveOrder;
                return (
                  <label
                    key={s.id}
                    className={cn(
                      'flex items-start gap-2 rounded-md border px-3 py-2',
                      hasActiveOrder ? 'cursor-not-allowed opacity-60 bg-muted/50 border-amber-200 dark:border-amber-800' : 'cursor-pointer',
                      !hasActiveOrder && selectedSubscriptionId === s.id ? 'border-primary bg-primary/10' : !hasActiveOrder && 'border-muted bg-muted/30'
                    )}
                  >
                    <input
                      type="radio"
                      name="subscription"
                      checked={selectedSubscriptionId === s.id}
                      onChange={() => !hasActiveOrder && setSelectedSubscriptionId(s.id)}
                      disabled={hasActiveOrder}
                      className="mt-1"
                    />
                    <div className="min-w-0">
                      <p className="font-bold text-sm leading-tight mb-1">{s.planName}</p>
                      <span className="inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/40 dark:text-green-200">Subscription</span>
                      {hasActiveOrder && <p className="text-amber-600 dark:text-amber-400 text-xs font-medium mt-1">Order in progress – wait for delivery to book again</p>}
                      <p className="text-muted-foreground text-sm">Valid till {new Date(s.validTill).toLocaleDateString()}</p>
                      <p>
                        Pickups: {s.remainingPickups}
                        {s.maxPickups != null ? ` / ${s.maxPickups}` : ''}
                      </p>
                      {s.remainingKg != null && <p>Remaining kg: {s.remainingKg}</p>}
                      {s.remainingItems != null && <p>Remaining items: {s.remainingItems}</p>}
                    </div>
                  </label>
                );
              })}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Create order</CardTitle>
            <CardDescription>
              Choose Individual or Subscription, then pickup date, location, and time. Confirm to place the order.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {validationError && (
                <p className="text-sm text-destructive" role="alert">
                  {validationError}
                </p>
              )}

              {/* 1. Order type: Individual or Subscription (subscription must be purchased first) */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Order type</label>
                <div className="flex flex-wrap gap-3">
                  <label className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2">
                    <input
                      type="radio"
                      name="orderType"
                      checked={orderType === 'INDIVIDUAL'}
                      onChange={() => setOrderType('INDIVIDUAL')}
                    />
                    <span className="text-sm font-medium">Individual</span>
                    <span className="text-xs text-muted-foreground">(Wash & fold, iron, etc.)</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2">
                    <input
                      type="radio"
                      name="orderType"
                      checked={orderType === 'SUBSCRIPTION'}
                      onChange={() => setOrderType('SUBSCRIPTION')}
                    />
                    <span className="text-sm font-medium">Subscription</span>
                    <span className="text-xs text-muted-foreground">(Use existing plan)</span>
                  </label>
                </div>
              </div>

              {/* 2. Subscription: one subscription per order (selected above) */}
              {orderType === 'SUBSCRIPTION' && activeSubscriptions.length === 0 && (
                <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-muted-foreground dark:border-amber-800 dark:bg-amber-950/30">
                  Purchase a subscription first from your profile to book with a plan. This order will be dedicated to that subscription.
                </p>
              )}
              {orderType === 'SUBSCRIPTION' && activeSubscriptions.length > 0 && availableSubscriptions.length === 0 && (
                <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-muted-foreground dark:border-amber-800 dark:bg-amber-950/30">
                  You have an order in progress for your plan. Wait for it to be delivered to book again with this subscription.
                </p>
              )}

              {/* 3. Pickup date */}
              <div className="space-y-2">
                <label htmlFor="pickupDate" className="text-sm font-medium">
                  Pickup date
                </label>
                <Input
                  id="pickupDate"
                  type="date"
                  min={today}
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                />
              </div>

              {/* 4. Location (address) */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Location</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={addressId}
                  onChange={(e) => setAddressId(e.target.value)}
                >
                  {addresses.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.label} – {a.addressLine}, {a.pincode}
                      {a.isDefault ? ' (Default)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* 5. Pickup time */}
              <div className="space-y-2">
                <label htmlFor="timeSlot" className="text-sm font-medium">
                  Pickup time
                </label>
                <select
                  id="timeSlot"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={timeSlotOptions.some((o) => o.value === timeWindow) ? timeWindow : timeSlotOptions[0]?.value ?? timeWindow}
                  onChange={(e) => setTimeWindow(e.target.value)}
                >
                  {timeSlotOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {isToday && timeSlotOptions.length === 0 && (
                  <p className="text-xs text-muted-foreground">No slots left today. Pick another date.</p>
                )}
              </div>

              {/* 6. If Individual: services + weight */}
              {orderType === 'INDIVIDUAL' && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Services (select at least one)</label>
                    <div className="flex flex-wrap gap-3">
                      {BOOKABLE_SERVICES.map((s) => (
                        <label key={s} className="flex cursor-pointer items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedServices.includes(s)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedServices((prev) => [...prev, s].sort());
                              } else {
                                setSelectedServices((prev) => prev.filter((x) => x !== s));
                              }
                            }}
                          />
                          <span className="text-sm">{s.replace(/_/g, ' ')}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="weight" className="text-sm font-medium">
                      Estimated weight (kg)
                    </label>
                    <Input
                      id="weight"
                      type="number"
                      min={0}
                      step={0.5}
                      value={estimatedWeightKg}
                      onChange={(e) => setEstimatedWeightKg(e.target.value)}
                      placeholder="Optional"
                    />
                  </div>
                </>
              )}

              <div className="flex gap-2 pt-2">
                <Button type="submit" className="flex-1" disabled={createOrder.isPending || !canSubmit}>
                  {createOrder.isPending ? 'Creating…' : 'Confirm order'}
                </Button>
                <Link href="/orders" className={cn(buttonVariants({ variant: 'outline' }))}>
                  Cancel
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
