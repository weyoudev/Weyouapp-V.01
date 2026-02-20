'use client';

import { useState } from 'react';
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
import { useCreateItem } from '@/hooks/useCatalog';
import { toast } from 'sonner';
import { getFriendlyErrorMessage } from '@/lib/api';
import { ErrorDisplay } from '@/components/shared/ErrorDisplay';

interface AddItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddItemModal({ open, onOpenChange }: AddItemModalProps) {
  const [name, setName] = useState('');
  const [active, setActive] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const createItem = useCreateItem();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }
    setError(null);
    createItem.mutate(
      { name: name.trim(), active },
      {
        onSuccess: () => {
          toast.success('Item added');
          setName('');
          setActive(true);
          setError(null);
          onOpenChange(false);
        },
        onError: (err) => {
          setError(err);
          toast.error(getFriendlyErrorMessage(err));
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add item</DialogTitle>
          </DialogHeader>
          {error && <ErrorDisplay error={error} />}
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="add-name" className="text-sm font-medium">
                Name
              </label>
              <Input
                id="add-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Item name"
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
            <Button type="submit" disabled={createItem.isPending}>
              {createItem.isPending ? 'Adding…' : 'Add'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
