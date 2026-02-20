'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAddresses, useCreateAddress, useUpdateAddress, ADDRESS_LABELS, type AddressItem } from '@/hooks/use-addresses';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

export default function AddressesPage() {
  const { data: addresses, isLoading } = useAddresses();
  const createAddress = useCreateAddress();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ label: 'Home', addressLine: '', pincode: '', isDefault: false });

  const resetForm = () => {
    setForm({ label: 'Home', addressLine: '', pincode: '', isDefault: false });
    setShowAdd(false);
    setEditingId(null);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createAddress.mutate(
      { ...form, isDefault: form.isDefault || (addresses?.length === 0) },
      { onSuccess: resetForm }
    );
  };

  if (isLoading || !addresses) {
    return (
      <div className="min-h-screen bg-muted/30 p-4">
        <Skeleton className="mx-auto h-64 max-w-lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 p-4">
      <header className="mb-6 flex items-center gap-4">
        <Link href="/orders" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}>
          ← Orders
        </Link>
      </header>
      <Card className="mx-auto max-w-lg">
        <CardHeader>
          <CardTitle>My addresses</CardTitle>
          <CardDescription>
            Add Home, Office, Friends Place, or Other. Edit anytime and choose one as default.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-3">
            {addresses.map((addr) => (
              <li key={addr.id}>
                {editingId === addr.id ? (
                  <EditAddressRow
                    address={addr}
                    onClose={() => setEditingId(null)}
                    onSaved={() => setEditingId(null)}
                  />
                ) : (
                  <AddressRow address={addr} onEdit={() => setEditingId(addr.id)} />
                )}
              </li>
            ))}
          </ul>

          {showAdd ? (
            <form onSubmit={handleCreate} className="space-y-3 rounded-lg border bg-muted/50 p-4">
              <h4 className="font-medium">New address</h4>
              <div className="space-y-2">
                <label className="text-sm font-medium">Label</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.label}
                  onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                >
                  {ADDRESS_LABELS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Address line</label>
                <Input
                  value={form.addressLine}
                  onChange={(e) => setForm((f) => ({ ...f, addressLine: e.target.value }))}
                  placeholder="Street, building, flat"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Pincode</label>
                <Input
                  value={form.pincode}
                  onChange={(e) => setForm((f) => ({ ...f, pincode: e.target.value }))}
                  placeholder="Pincode"
                  required
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="newDefault"
                  checked={form.isDefault}
                  onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
                />
                <label htmlFor="newDefault" className="text-sm font-medium">Set as default</label>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={createAddress.isPending}>
                  {createAddress.isPending ? 'Adding…' : 'Add address'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <Button variant="outline" onClick={() => setShowAdd(true)} className="w-full">
              + Add address
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AddressRow({ address, onEdit }: { address: AddressItem; onEdit: () => void }) {
  return (
    <div className="flex items-start justify-between gap-2 rounded-lg border p-3">
      <div>
        <p className="font-medium">
          {address.label}
          {address.isDefault && (
            <span className="ml-2 text-xs text-muted-foreground">(Default)</span>
          )}
        </p>
        <p className="text-sm text-muted-foreground">{address.addressLine}</p>
        <p className="text-sm text-muted-foreground">Pincode: {address.pincode}</p>
      </div>
      <Button variant="ghost" size="sm" onClick={onEdit}>
        Edit
      </Button>
    </div>
  );
}

function EditAddressRow({
  address,
  onClose,
  onSaved,
}: {
  address: AddressItem;
  onClose: () => void;
  onSaved: () => void;
}) {
  const updateAddress = useUpdateAddress(address.id);
  const [label, setLabel] = useState(address.label);
  const [addressLine, setAddressLine] = useState(address.addressLine);
  const [pincode, setPincode] = useState(address.pincode);
  const [isDefault, setIsDefault] = useState(address.isDefault);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateAddress.mutate(
      { label, addressLine, pincode, isDefault },
      { onSuccess: onSaved }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border bg-muted/50 p-4">
      <h4 className="font-medium">Edit address</h4>
      <div className="space-y-2">
        <label className="text-sm font-medium">Label</label>
        <select
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        >
          {ADDRESS_LABELS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Address line</label>
        <Input
          value={addressLine}
          onChange={(e) => setAddressLine(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Pincode</label>
        <Input value={pincode} onChange={(e) => setPincode(e.target.value)} required />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="editDefault"
          checked={isDefault}
          onChange={(e) => setIsDefault(e.target.checked)}
        />
        <label htmlFor="editDefault" className="text-sm font-medium">Set as default</label>
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={updateAddress.isPending}>
          {updateAddress.isPending ? 'Saving…' : 'Save'}
        </Button>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
