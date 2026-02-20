'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/hooks/useDebounce';
import { useCustomersList } from '@/hooks/useCustomers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { CustomersTable } from '@/components/admin/customers/CustomersTable';
import { EmptyState } from '@/components/ui/empty-state';
import { toast } from 'sonner';
import { Search, X } from 'lucide-react';
import type { AxiosError } from 'axios';

function getErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const ax = err as AxiosError<{ error?: { message?: string } }>;
    const msg = ax.response?.data?.error?.message ?? ax.message;
    return msg || 'Request failed';
  }
  return err instanceof Error ? err.message : 'Request failed';
}

const PAGE_SIZE = 20;

export default function CustomersPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [cursor, setCursor] = useState<string | null>(null);
  const debouncedSearch = useDebounce(search.trim(), 400);

  const { data, isLoading, error } = useCustomersList(PAGE_SIZE, cursor, debouncedSearch || null);

  const handleRowClick = useCallback(
    (userId: string) => {
      router.push(`/customers/${userId}`);
    },
    [router]
  );

  const handleClear = useCallback(() => {
    setSearch('');
    setCursor(null);
  }, []);

  const items = data?.data ?? [];
  const nextCursor = data?.nextCursor ?? null;
  const hasNext = !!nextCursor;

  if (error) {
    toast.error(getErrorMessage(error));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Customers</h1>
        <p className="text-sm text-muted-foreground mt-1">
          List of customers with order and subscription counts. Search by name or phone, or open a profile from the table.
        </p>
      </div>

      {/* Search bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by name or phone (e.g. 9876543210 or +919876543210)"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCursor(null);
                }}
                className="pl-9"
              />
            </div>
            <Button variant="outline" size="icon" onClick={handleClear} title="Clear">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Customer list */}
      <Card>
        <CardContent className="pt-6">
          <CustomersTable
            data={items}
            isLoading={isLoading}
            onRowClick={handleRowClick}
          />
          <div className="flex items-center justify-between mt-4">
            <p className="text-xs text-muted-foreground">
              {items.length} customer{items.length === 1 ? '' : 's'} on this page
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!cursor}
                onClick={() => setCursor(null)}
              >
                First page
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!hasNext}
                onClick={() => nextCursor && setCursor(nextCursor)}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
