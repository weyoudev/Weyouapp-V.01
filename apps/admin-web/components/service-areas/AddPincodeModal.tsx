'use client';

import { useState } from 'react';
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
import { useCreateServiceArea } from '@/hooks/useServiceAreas';
import { useBranches } from '@/hooks/useBranches';
import { toast } from 'sonner';
import { getApiError } from '@/lib/api';

const addPincodeSchema = z.object({
  pincode: z.string().regex(/^\d{6}$/, 'Pincode must be exactly 6 digits'),
  branchId: z.string().min(1, 'Select a branch'),
  active: z.boolean(),
});

type AddPincodeFormValues = z.infer<typeof addPincodeSchema>;

interface AddPincodeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddPincodeModal({ open, onOpenChange }: AddPincodeModalProps) {
  const [pincode, setPincode] = useState('');
  const [branchId, setBranchId] = useState('');
  const [active, setActive] = useState(true);
  const createArea = useCreateServiceArea();
  const { data: branches = [] } = useBranches();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = addPincodeSchema.safeParse({ pincode: pincode.trim(), branchId: branchId || undefined, active });
    if (!result.success) {
      const msg = result.error.flatten().fieldErrors.pincode?.[0]
        ?? result.error.flatten().fieldErrors.branchId?.[0]
        ?? result.error.message;
      toast.error(msg);
      return;
    }
    if (!branchId) {
      toast.error('Select a branch');
      return;
    }
    createArea.mutate({ pincode: result.data.pincode, branchId, active }, {
      onSuccess: () => {
        toast.success('Pincode added');
        setPincode('');
        setBranchId('');
        setActive(true);
        onOpenChange(false);
      },
      onError: (err) => {
        const apiErr = getApiError(err);
        if (apiErr.code === 'PINCODE_ALREADY_IN_OTHER_BRANCH') {
          toast.error('This pincode is already added to another branch.');
        } else {
          toast.error(apiErr.message);
        }
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add pincode</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="add-branch" className="text-sm font-medium">
                Branch
              </label>
              <select
                id="add-branch"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                required
              >
                <option value="">Select branch…</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <label htmlFor="add-pincode" className="text-sm font-medium">
                Pincode (6 digits)
              </label>
              <Input
                id="add-pincode"
                inputMode="numeric"
                maxLength={6}
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                placeholder="110001"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch id="add-active" checked={active} onCheckedChange={setActive} />
              <label htmlFor="add-active" className="text-sm font-medium">
                Active
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createArea.isPending}>
              {createArea.isPending ? 'Adding…' : 'Add'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
