'use client';

import { useQueryClient } from '@tanstack/react-query';
import { getToken, getStoredUser, logout } from '@/lib/auth';
import { API_BASE_URL } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { RefreshCw, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { useSystemStatus } from '@/hooks/use-system-status';
import { cn } from '@/lib/utils';

function StatusDot({ status }: { status: 'green' | 'yellow' | 'red' }) {
  return (
    <span
      className={cn(
        'inline-block h-2 w-2 rounded-full',
        status === 'green' && 'bg-green-500',
        status === 'yellow' && 'bg-amber-500',
        status === 'red' && 'bg-red-500'
      )}
      title={status}
    />
  );
}

export function DevTopBar() {
  const queryClient = useQueryClient();
  const token = typeof window !== 'undefined' ? getToken() : null;
  const user = typeof window !== 'undefined' ? getStoredUser() : null;
  const { api, auth, db, dbInfo, lastError, checking, refresh } = useSystemStatus();

  const handleInvalidate = () => {
    queryClient.invalidateQueries();
    toast.success('Cache invalidated');
  };

  return (
    <div className="flex items-center justify-between gap-4 border-b bg-muted/40 px-4 py-2 text-xs">
      <div className="flex flex-wrap items-center gap-4">
        <span className="font-medium text-muted-foreground">Dev Tools</span>
        <span title={API_BASE_URL}>
          API: {API_BASE_URL.replace(/^https?:\/\//, '').slice(0, 40)}
          {(API_BASE_URL.length > 50) ? '…' : ''}
        </span>
        {dbInfo && (
          <span className="text-muted-foreground" title={dbInfo.db_host}>
            DB: {dbInfo.db_host_display} · {dbInfo.database_name}
          </span>
        )}
        <span>
          User: {user?.email ?? user?.phone ?? user?.id ?? '—'} · Role: {user?.role ?? '—'}
        </span>
        <span>Token: {token ? 'yes' : 'no'}</span>
        <span className="flex items-center gap-1.5">
          <span className="text-muted-foreground">Status</span>
          <StatusDot status={api} />
          <StatusDot status={auth} />
          <StatusDot status={db} />
          {checking && <span className="text-muted-foreground">…</span>}
          {lastError && (
            <span className="max-w-[200px] truncate text-amber-700 dark:text-amber-400" title={lastError}>
              {lastError}
            </span>
          )}
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={refresh} disabled={checking}>
            <RefreshCw className={cn('h-3 w-3', checking && 'animate-spin')} />
          </Button>
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1"
          onClick={handleInvalidate}
        >
          <RefreshCw className="h-3 w-3" />
          Invalidate cache
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1"
          onClick={() => {
            logout();
            toast.info('Logged out');
          }}
        >
          <LogOut className="h-3 w-3" />
          Logout
        </Button>
      </div>
    </div>
  );
}
