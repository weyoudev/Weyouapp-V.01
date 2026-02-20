'use client';

import { useState, useEffect } from 'react';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useUpdateCustomer } from '@/hooks/useCustomers';
import { toast } from 'sonner';
import type { CustomerRecord } from '@/types';
import type { Role } from '@/lib/auth';
import { Loader2 } from 'lucide-react';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  notes: z.string().max(2000, 'Notes max 2000 characters').optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export interface CustomerProfileCardProps {
  customer: CustomerRecord;
  role: Role;
  /** When provided, modal is controlled by parent (e.g. so header Edit can open it) */
  modalOpen?: boolean;
  onModalOpenChange?: (open: boolean) => void;
}

export function CustomerProfileCard({
  customer,
  role,
  modalOpen: controlledOpen,
  onModalOpenChange: controlledSetOpen,
}: CustomerProfileCardProps) {
  const canEdit = role === 'ADMIN';
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const modalOpen = isControlled ? controlledOpen : internalOpen;
  const setModalOpen = isControlled ? (controlledSetOpen ?? (() => {})) : setInternalOpen;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');

  const updateCustomer = useUpdateCustomer(customer.id);

  useEffect(() => {
    setName(customer.name ?? '');
    setEmail(customer.email ?? '');
    setNotes(customer.notes ?? '');
  }, [customer]);

  const handleOpen = () => {
    setName(customer.name ?? '');
    setEmail(customer.email ?? '');
    setNotes(customer.notes ?? '');
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = profileSchema.safeParse({
      name: name.trim(),
      email: email.trim() || undefined,
      notes: notes.trim() || undefined,
    });
    if (!result.success) {
      const msg =
        result.error.flatten().fieldErrors.name?.[0] ??
        result.error.flatten().fieldErrors.email?.[0] ??
        result.error.message;
      toast.error(msg);
      return;
    }
    updateCustomer.mutate(
      {
        name: result.data.name,
        email: result.data.email ?? null,
        notes: result.data.notes ?? null,
      },
      {
        onSuccess: () => {
          toast.success('Profile updated');
          setModalOpen(false);
        },
        onError: (err) => toast.error((err as Error).message),
      }
    );
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField label="Name">
            <Input value={customer.name ?? ''} disabled className="bg-muted" />
          </FormField>
          <FormField label="Phone">
            <Input value={customer.phone ?? ''} disabled className="bg-muted" />
          </FormField>
          <FormField label="Email">
            <Input value={customer.email ?? ''} disabled className="bg-muted" />
          </FormField>
          <FormField label="Notes">
            <Input
              value={customer.notes ?? ''}
              disabled
              className="bg-muted min-h-[80px]"
              readOnly
            />
          </FormField>
          {canEdit && (
            <Button variant="outline" size="sm" onClick={handleOpen}>
              Edit profile
            </Button>
          )}
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Edit profile</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <FormField label="Name" htmlFor="profile-name">
                <Input
                  id="profile-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Name"
                />
              </FormField>
              <FormField label="Email (optional)" htmlFor="profile-email">
                <Input
                  id="profile-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                />
              </FormField>
              <FormField label="Notes (optional)" htmlFor="profile-notes">
                <Input
                  id="profile-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notes"
                  className="min-h-[80px]"
                />
              </FormField>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateCustomer.isPending}>
                {updateCustomer.isPending ? (
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
    </>
  );
}
