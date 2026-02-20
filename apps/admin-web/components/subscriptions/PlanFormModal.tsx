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
import { useCreatePlan, useUpdatePlan } from '@/hooks/useSubscriptionPlans';
import { useBranches } from '@/hooks/useBranches';
import { toast } from 'sonner';
import { getFriendlyErrorMessage } from '@/lib/api';
import type { SubscriptionPlan, SubscriptionVariant, RedemptionMode } from '@/types';

type LimitType = 'none' | 'kg' | 'items';

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

const VARIANT_OPTIONS: { value: SubscriptionVariant; label: string }[] = [
  { value: 'SINGLE', label: 'Single' },
  { value: 'COUPLE', label: 'Couple' },
  { value: 'FAMILY', label: 'Family' },
];

const REDEMPTION_OPTIONS: { value: RedemptionMode; label: string }[] = [
  { value: 'MULTI_USE', label: 'Multi-use (default)' },
  { value: 'SINGLE_USE', label: 'Single-use (one time per customer)' },
];

const planSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  variant: z.enum(['SINGLE', 'COUPLE', 'FAMILY']),
  validityDays: z.coerce.number().int().min(1, 'At least 1 day'),
  maxPickups: z.coerce.number().int().min(0, 'At least 0'),
  limitType: z.enum(['none', 'kg', 'items']),
  limitValue: z.union([z.string(), z.number()]).transform((v) => {
    if (v === '' || v === null || v === undefined) return null;
    const n = typeof v === 'string' ? (v.includes('.') ? parseFloat(v) : parseInt(v, 10)) : v;
    return isNaN(n) ? null : n;
  }),
  pricePaise: z.coerce.number().int().min(0, 'Price must be ≥ 0'),
  active: z.boolean(),
}).refine(
  (data) => {
    if (data.limitType === 'kg') return data.limitValue != null && data.limitValue > 0;
    if (data.limitType === 'items') return data.limitValue != null && data.limitValue > 0;
    return true;
  },
  { message: 'Enter a value for the selected limit type', path: ['limitValue'] },
);

type PlanFormValues = z.infer<typeof planSchema>;

interface PlanFormModalProps {
  plan: SubscriptionPlan | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'add' | 'edit';
}

export function PlanFormModal({ plan, open, onOpenChange, mode }: PlanFormModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [redemptionMode, setRedemptionMode] = useState<RedemptionMode>('MULTI_USE');
  const [variant, setVariant] = useState<SubscriptionVariant>('SINGLE');
  const [validityDays, setValidityDays] = useState('');
  const [maxPickups, setMaxPickups] = useState('');
  const [limitType, setLimitType] = useState<LimitType>('none');
  const [limitValue, setLimitValue] = useState('');
  const [priceRupees, setPriceRupees] = useState('');
  const [active, setActive] = useState(true);
  const [branchIds, setBranchIds] = useState<string[]>([]);

  const descriptionWordCount = countWords(description);
  const descriptionOverLimit = descriptionWordCount > 100;

  const createPlan = useCreatePlan();
  const updatePlan = useUpdatePlan(plan?.id ?? '');
  const { data: branches = [] } = useBranches();

  useEffect(() => {
    if (mode === 'edit' && plan) {
      setName(plan.name);
      setDescription(plan.description ?? '');
      setRedemptionMode(plan.redemptionMode ?? 'MULTI_USE');
      setVariant(plan.variant);
      setValidityDays(String(plan.validityDays));
      setMaxPickups(String(plan.maxPickups));
      if (plan.kgLimit != null && plan.kgLimit > 0) {
        setLimitType('kg');
        setLimitValue(String(plan.kgLimit));
      } else if (plan.itemsLimit != null && plan.itemsLimit > 0) {
        setLimitType('items');
        setLimitValue(String(plan.itemsLimit));
      } else {
        setLimitType('none');
        setLimitValue('');
      }
      setPriceRupees((plan.pricePaise / 100).toFixed(2));
      setActive(plan.active);
      setBranchIds(plan.branchIds ?? []);
    } else if (mode === 'add') {
      setName('');
      setDescription('');
      setRedemptionMode('MULTI_USE');
      setVariant('SINGLE');
      setValidityDays('30');
      setMaxPickups('4');
      setLimitType('none');
      setLimitValue('');
      setPriceRupees('');
      setActive(true);
      setBranchIds([]);
    }
  }, [mode, plan, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = planSchema.safeParse({
      name: name.trim(),
      variant,
      validityDays,
      maxPickups,
      limitType,
      limitValue: limitValue.trim() === '' ? null : limitValue,
      pricePaise: Math.round(parseFloat(priceRupees || '0') * 100),
      active,
    });
    if (!result.success) {
      const msg = result.error.flatten().fieldErrors?.name?.[0]
        ?? result.error.flatten().fieldErrors?.validityDays?.[0]
        ?? result.error.flatten().fieldErrors?.limitValue?.[0]
        ?? result.error.flatten().fieldErrors?.pricePaise?.[0]
        ?? result.error.message;
      toast.error(msg);
      return;
    }
    if (descriptionOverLimit) {
      toast.error('Description must not exceed 100 words.');
      return;
    }
    const kgLimit = result.data.limitType === 'kg' ? result.data.limitValue : null;
    const itemsLimit = result.data.limitType === 'items' ? result.data.limitValue : null;
    const body = {
      name: result.data.name,
      description: description.trim() === '' ? null : description.trim(),
      redemptionMode,
      variant: result.data.variant,
      validityDays: result.data.validityDays,
      maxPickups: result.data.maxPickups,
      kgLimit: kgLimit ?? undefined,
      itemsLimit: itemsLimit ?? undefined,
      pricePaise: result.data.pricePaise,
      active: result.data.active,
      branchIds,
    };
    if (mode === 'add') {
      createPlan.mutate(body, {
        onSuccess: () => {
          toast.success('Plan created');
          onOpenChange(false);
        },
        onError: (err) => toast.error(getFriendlyErrorMessage(err)),
      });
    } else if (plan) {
      updatePlan.mutate(body, {
        onSuccess: () => {
          toast.success('Plan updated');
          onOpenChange(false);
        },
        onError: (err) => toast.error(getFriendlyErrorMessage(err)),
      });
    }
  };

  const isPending = createPlan.isPending || updatePlan.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] flex flex-col p-0 gap-0">
        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1 flex">
          <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-2">
            <DialogTitle>{mode === 'add' ? 'Add plan' : 'Edit plan'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4 px-6 overflow-y-auto min-h-0 flex-1">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Plan name" />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Description (Max 100 words)</label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional plan description"
                rows={3}
              />
              <p className={descriptionOverLimit ? 'text-sm text-destructive' : 'text-sm text-muted-foreground'}>
                {descriptionWordCount} / 100 words
              </p>
              {descriptionOverLimit && (
                <p className="text-sm text-destructive">Description must not exceed 100 words.</p>
              )}
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Redemption</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={redemptionMode}
                onChange={(e) => setRedemptionMode(e.target.value as RedemptionMode)}
              >
                {REDEMPTION_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Variant</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={variant}
                onChange={(e) => setVariant(e.target.value as SubscriptionVariant)}
              >
                {VARIANT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Branches</label>
              <p className="text-xs text-muted-foreground">Leave empty or select &quot;All branches&quot; to apply to every branch. Or pick specific branches.</p>
              <div className="max-h-40 overflow-y-auto rounded-md border border-input bg-background p-2 space-y-1.5">
                <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent">
                  <input
                    type="checkbox"
                    checked={branchIds.length === 0}
                    onChange={() => setBranchIds([])}
                    className="h-4 w-4 rounded border-input"
                  />
                  <span>All branches</span>
                </label>
                {branches.map((b) => (
                  <label key={b.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent">
                    <input
                      type="checkbox"
                      checked={branchIds.includes(b.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setBranchIds((prev) => [...prev, b.id]);
                        } else {
                          setBranchIds((prev) => prev.filter((id) => id !== b.id));
                        }
                      }}
                      className="h-4 w-4 rounded border-input"
                    />
                    <span>{b.name}</span>
                  </label>
                ))}
                {branches.length === 0 && (
                  <p className="px-2 py-1 text-xs text-muted-foreground">No branches defined.</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Validity (days)</label>
                <Input
                  type="number"
                  min={1}
                  value={validityDays}
                  onChange={(e) => setValidityDays(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Max pickups</label>
                <Input
                  type="number"
                  min={0}
                  value={maxPickups}
                  onChange={(e) => setMaxPickups(e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-3">
              <label className="text-sm font-medium">Limit by</label>
              <div className="flex flex-wrap gap-4">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="limitType"
                    checked={limitType === 'none'}
                    onChange={() => { setLimitType('none'); setLimitValue(''); }}
                    className="h-4 w-4"
                  />
                  <span className="text-sm">None</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="limitType"
                    checked={limitType === 'kg'}
                    onChange={() => { setLimitType('kg'); setLimitValue(''); }}
                    className="h-4 w-4"
                  />
                  <span className="text-sm">KG</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="limitType"
                    checked={limitType === 'items'}
                    onChange={() => { setLimitType('items'); setLimitValue(''); }}
                    className="h-4 w-4"
                  />
                  <span className="text-sm">Item count</span>
                </label>
              </div>
              {(limitType === 'kg' || limitType === 'items') && (
                <div className="grid gap-2">
                  <label className="text-sm font-medium">
                    {limitType === 'kg' ? 'Weight limit (kg)' : 'Number of items'}
                  </label>
                  <Input
                    type="number"
                    min={1}
                    step={limitType === 'kg' ? 0.1 : 1}
                    placeholder={limitType === 'kg' ? 'e.g. 45' : 'e.g. 100'}
                    value={limitValue}
                    onChange={(e) => setLimitValue(e.target.value)}
                  />
                </div>
              )}
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Price (₹)</label>
              <Input
                type="number"
                min={0}
                step={0.01}
                placeholder="0.00"
                value={priceRupees}
                onChange={(e) => setPriceRupees(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={active} onCheckedChange={setActive} />
              <label className="text-sm font-medium">Active</label>
            </div>
          </div>
          <DialogFooter className="flex-shrink-0 px-6 pb-6 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || descriptionOverLimit}>
              {isPending ? 'Saving…' : mode === 'add' ? 'Add' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
