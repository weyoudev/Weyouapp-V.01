'use client';

import { cn } from '@/lib/utils';

interface FormFieldProps {
  label: string;
  htmlFor?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}

export function FormField({ label, htmlFor, error, className, children }: FormFieldProps) {
  return (
    <div className={cn('grid gap-2', className)}>
      {label && (
        <label htmlFor={htmlFor} className="text-sm font-medium">
          {label}
        </label>
      )}
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
