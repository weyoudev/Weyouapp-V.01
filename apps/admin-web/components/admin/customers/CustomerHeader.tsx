'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { RoleGate } from '@/components/shared/RoleGate';
import { formatDate } from '@/lib/format';
import type { CustomerRecord } from '@/types';
import { ArrowLeft, Pencil, PlusCircle } from 'lucide-react';
import type { Role } from '@/lib/auth';

export interface CustomerHeaderProps {
  customer: CustomerRecord;
  onBack: () => void;
  onEditClick: () => void;
  role: Role;
}

export function CustomerHeader({ customer, onBack, onEditClick, role }: CustomerHeaderProps) {
  const createWalkInOrderHref = `/walk-in-orders/new?userId=${encodeURIComponent(customer.id)}`;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} title="Back">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">{customer.name ?? 'No name'}</h1>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {customer.phone && <span>{customer.phone}</span>}
            {customer.email && <span>{customer.email}</span>}
            <span>Joined {formatDate(customer.createdAt)}</span>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="default" size="sm" asChild>
          <Link href={createWalkInOrderHref} className="inline-flex items-center gap-2">
            <PlusCircle className="h-4 w-4 shrink-0" />
            <span>Create walk-in order</span>
          </Link>
        </Button>
        <RoleGate role={role} gate="customersEdit">
          <Button variant="outline" size="sm" onClick={onEditClick}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit profile
          </Button>
        </RoleGate>
      </div>
    </div>
  );
}
