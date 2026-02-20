import { Suspense } from 'react';
import { AdminUsersTable } from '@/components/admin/users/AdminUsersTable';

export default function AdminUsersPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Admin users</h1>
        <p className="text-sm text-muted-foreground">
          Manage admin, billing, and ops users for the laundry platform.
        </p>
      </div>
      <Suspense fallback={<div className="text-sm text-muted-foreground">Loading users…</div>}>
        <AdminUsersTable />
      </Suspense>
    </div>
  );
}

