'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function OrderDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const hasRetriedRef = useRef(false);

  useEffect(() => {
    console.error('Order detail error:', error);

    // Auto-retry once for the common transient React #310 hydration error
    if (!hasRetriedRef.current && (error?.message || '').includes('Minified React error #310')) {
      hasRetriedRef.current = true;
      reset();
    }
  }, [error, reset]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 p-6">
      <h2 className="text-lg font-semibold">Something went wrong loading this order</h2>
      <p className="text-sm text-muted-foreground text-center max-w-md">
        {error.message || 'A client-side error occurred. Check the browser console for details.'}
      </p>
      <div className="flex gap-2">
        <Button variant="outline" asChild>
          <Link href="/orders">← Back to Orders</Link>
        </Button>
        <Button onClick={reset}>Try again</Button>
      </div>
    </div>
  );
}
