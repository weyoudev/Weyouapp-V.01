'use client';

import { useState, useEffect, useCallback } from 'react';
import { api, getApiOrigin, getApiError } from '@/lib/api';
import { getToken, getStoredUser } from '@/lib/auth';

export type StatusState = 'green' | 'yellow' | 'red';

export interface DbInfoFromApi {
  database_name: string;
  db_host: string;
  db_host_display: string;
}

export interface SystemStatusResult {
  api: StatusState;
  auth: StatusState;
  db: StatusState;
  dbInfo: DbInfoFromApi | null;
  lastError: string | null;
  checking: boolean;
  refresh: () => void;
}

export function useSystemStatus(): SystemStatusResult {
  const [apiState, setApiState] = useState<StatusState>('red');
  const [authState, setAuthState] = useState<StatusState>('red');
  const [dbState, setDbState] = useState<StatusState>('red');
  const [dbInfo, setDbInfo] = useState<DbInfoFromApi | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  const run = useCallback(async () => {
    setChecking(true);
    setLastError(null);
    const origin = getApiOrigin();
    const token = typeof window !== 'undefined' ? getToken() : null;
    const user = typeof window !== 'undefined' ? getStoredUser() : null;

    // 1) API reachable (GET /)
    try {
      const res = await fetch(`${origin}/`, { method: 'GET', signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        setApiState('green');
      } else {
        setApiState('yellow');
        setLastError(`GET / returned ${res.status}`);
      }
    } catch (e) {
      setApiState('red');
      setLastError(getApiError(e).message || 'API unreachable');
    }

    // 2) Auth + DB: GET /admin/orders?limit=1 (requires auth, hits DB)
    if (!token || !user) {
      setAuthState('red');
      setDbState('red');
      setDbInfo(null);
      setLastError((prev) => prev || 'Not logged in');
      setChecking(false);
      return;
    }
    try {
      await api.get('/admin/orders', { params: { limit: 1 }, timeout: 8000 });
      setAuthState('green');
      setDbState('green');
      try {
        const { data } = await api.get<{ database_name: string; db_host: string; db_host_display: string }>('/admin/system/db-info', { timeout: 5000 });
        setDbInfo({ database_name: data.database_name, db_host: data.db_host, db_host_display: data.db_host_display });
      } catch {
        setDbInfo(null);
      }
    } catch (e: unknown) {
      const err = getApiError(e);
      if (err.status === 401) {
        setAuthState('red');
        setDbState('yellow');
        setLastError(err.message || 'Auth failed');
      } else {
        setAuthState('yellow');
        setDbState('red');
        setLastError(err.message || 'Request failed');
      }
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    run();
  }, [run]);

  return { api: apiState, auth: authState, db: dbState, dbInfo, lastError, checking, refresh: run };
}
