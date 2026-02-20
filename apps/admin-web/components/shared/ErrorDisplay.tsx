'use client';

import { Button } from '@/components/ui/button';
import { getFriendlyErrorMessage, getApiErrorDetails, getApiError } from '@/lib/api';
import { toast } from 'sonner';
import { Copy } from 'lucide-react';

const SCHEMA_FIX_STEPS = `1. Stop the API (Ctrl+C in the terminal where it's running)
2. From repo root run: npm run prisma:migrate
3. Then run: npm run prisma:generate
4. Start the API again: npm run dev:api`;

interface ErrorDisplayProps {
  error: unknown;
  className?: string;
}

export function ErrorDisplay({ error, className }: ErrorDisplayProps) {
  const apiError = getApiError(error);
  const message = getFriendlyErrorMessage(error);
  const isSchemaError = apiError.code === 'SCHEMA_OUT_OF_DATE';

  const handleCopyDetails = () => {
    navigator.clipboard.writeText(getApiErrorDetails(error));
    toast.success('Error details copied');
  };
  const handleCopyFixSteps = () => {
    navigator.clipboard.writeText(SCHEMA_FIX_STEPS);
    toast.success('Fix steps copied to clipboard');
  };

  return (
    <div className={className}>
      <p className="text-sm text-destructive" role="alert">
        {message}
      </p>
      {isSchemaError && (
        <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40 p-3 text-sm">
          <p className="font-medium text-amber-800 dark:text-amber-200">Fix steps</p>
          <ol className="mt-1 list-decimal list-inside space-y-1 text-amber-700 dark:text-amber-300">
            <li>Stop the API (Ctrl+C in the terminal where it&apos;s running)</li>
            <li>From repo root run: <code className="rounded bg-amber-100 dark:bg-amber-900 px-1">npm run prisma:migrate</code></li>
            <li>Then run: <code className="rounded bg-amber-100 dark:bg-amber-900 px-1">npm run prisma:generate</code></li>
            <li>Start the API again: <code className="rounded bg-amber-100 dark:bg-amber-900 px-1">npm run dev:api</code></li>
          </ol>
          <Button variant="outline" size="sm" className="mt-2 gap-1" onClick={handleCopyFixSteps}>
            <Copy className="h-3 w-3" />
            Copy fix steps
          </Button>
        </div>
      )}
      <Button variant="outline" size="sm" className="mt-2 gap-1" onClick={handleCopyDetails}>
        <Copy className="h-3 w-3" />
        Copy error details
      </Button>
    </div>
  );
}
