'use client';

import { useState, useEffect } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { FormField } from '@/components/ui/form-field';
import { useSubscriptionOverride } from '@/hooks/useCustomers';
import { toast } from 'sonner';
import type { CustomerSubscriptionInfo } from '@/types';
import type { AxiosError } from 'axios';
import { Loader2 } from 'lucide-react';

const overrideSchema = z.object({
  active: z.boolean(),
  expiryDate: z.string().optional(),
  usedKg: z.coerce.number().min(0).optional(),
  usedItemsCount: z.coerce.number().min(0).optional(),
  usedPickups: z.coerce.number().min(0).optional(),
});

type OverrideFormValues = z.infer<typeof overrideSchema>;

function toDateInputValue(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toISOString().slice(0, 10);
  } catch {
    return '';
  }
}

export interface SubscriptionOverrideModalProps {
  userId: string;
  subscription: CustomerSubscriptionInfo;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SubscriptionOverrideModal({
  userId,
  subscription,
  open,
  onOpenChange,
}: SubscriptionOverrideModalProps) {
  const [active, setActive] = useState(subscription.active);
  const [expiryDate, setExpiryDate] = useState('');
  const [usedKg, setUsedKg] = useState('');
  const [usedItemsCount, setUsedItemsCount] = useState('');
  const [usedPickups, setUsedPickups] = useState('');

  const overrideMutation = useSubscriptionOverride(userId);

  useEffect(() => {
    if (subscription) {
      setActive(subscription.active);
      setExpiryDate(toDateInputValue(subscription.expiryDate));
      setUsedKg(String(subscription.usedKg));
      setUsedItemsCount(String(subscription.usedItemsCount));
      setUsedPickups(String(subscription.usedPickups ?? 0));
    }
  }, [subscription, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = overrideSchema.safeParse({
      active,
      expiryDate: expiryDate.trim() || undefined,
      usedKg: usedKg === '' ? undefined : usedKg,
      usedItemsCount: usedItemsCount === '' ? undefined : usedItemsCount,
      usedPickups: usedPickups === '' ? undefined : usedPickups,
    });
    if (!result.success) {
      toast.error(result.error.flatten().fieldErrors.active?.[0] ?? result.error.message);
      return;
    }
    const body = {
      active: result.data.active,
      ...(result.data.expiryDate && { expiryDate: result.data.expiryDate }),
      ...(result.data.usedKg !== undefined && { usedKg: result.data.usedKg }),
      ...(result.data.usedItemsCount !== undefined && { usedItemsCount: result.data.usedItemsCount }),
      ...(result.data.usedPickups !== undefined && { usedPickups: result.data.usedPickups }),
    };
    overrideMutation.mutate(body, {
      onSuccess: () => {
        toast.success('Subscription updated');
        onOpenChange(false);
      },
      onError: (err) => {
        const ax = err as AxiosError<{ error?: { message?: string } }>;
        const status = ax.response?.status;
        const msg = ax.response?.data?.error?.message ?? ax.message;
        if (status === 404 || status === 501 || msg?.toLowerCase().includes('not implemented')) {
          toast.error('Subscription override API not implemented yet.');
        } else {
          toast.error(msg || 'Failed to update subscription');
        }
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Override subscription</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex items-center gap-2">
              <Switch id="override-active" checked={active} onCheckedChange={setActive} />
              <label htmlFor="override-active" className="text-sm font-medium">
                Active
              </label>
            </div>
            <FormField label="Expiry date (optional)" htmlFor="override-expiry">
              <Input
                id="override-expiry"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </FormField>
            <FormField label="Used kg (optional)" htmlFor="override-kg">
              <Input
                id="override-kg"
                type="number"
                min={0}
                value={usedKg}
                onChange={(e) => setUsedKg(e.target.value)}
              />
            </FormField>
            <FormField label="Used items (optional)" htmlFor="override-items">
              <Input
                id="override-items"
                type="number"
                min={0}
                value={usedItemsCount}
                onChange={(e) => setUsedItemsCount(e.target.value)}
              />
            </FormField>
            <FormField label="Used pickups (optional)" htmlFor="override-pickups">
              <Input
                id="override-pickups"
                type="number"
                min={0}
                value={usedPickups}
                onChange={(e) => setUsedPickups(e.target.value)}
              />
            </FormField>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={overrideMutation.isPending}>
              {overrideMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                'Save'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
