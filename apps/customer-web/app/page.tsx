'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getToken } from '@/lib/auth';

export default function HomePage() {
  const router = useRouter();
  useEffect(() => {
    if (getToken()) router.replace('/orders');
    else router.replace('/login');
  }, [router]);
  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-muted-foreground">Redirecting…</p>
    </div>
  );
}
