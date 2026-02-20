'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { z } from 'zod';
import { useFeedbackEligibility } from '@/hooks/use-feedback-eligibility';
import { useSubmitOrderFeedback } from '@/hooks/use-submit-order-feedback';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const formSchema = z.object({
  rating: z.coerce.number().min(1).max(5),
  message: z.string().optional(),
});

export default function OrderFeedbackPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = typeof params.id === 'string' ? params.id : null;
  const { data: eligibility, isLoading: eligLoading } = useFeedbackEligibility(orderId);
  const submitFeedback = useSubmitOrderFeedback();
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  if (eligLoading || !orderId) {
    return (
      <div className="min-h-screen bg-muted/30 p-4">
        <Skeleton className="mx-auto h-48 max-w-md" />
      </div>
    );
  }

  if (!eligibility?.eligible) {
    return (
      <div className="min-h-screen bg-muted/30 p-4">
        <Card className="mx-auto max-w-md">
          <CardHeader>
            <CardTitle>Feedback not available</CardTitle>
            <CardDescription>
              {eligibility?.reason ?? 'You can only submit feedback for delivered, paid orders.'}
              {eligibility?.alreadySubmitted && ' You have already submitted feedback for this order.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={`/orders/${orderId}`} className={cn(buttonVariants({ variant: 'outline' }))}>
              Back to order
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError(null);
    const parsed = formSchema.safeParse({ rating, message });
    if (!parsed.success) {
      setValidationError(parsed.error.errors[0]?.message ?? 'Invalid input');
      return;
    }
    if (!orderId) return;
    submitFeedback.mutate(
      {
        orderId,
        rating: parsed.data.rating,
        message: parsed.data.message,
      },
      {
        onSuccess: () => router.push(`/orders/${orderId}`),
      }
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 p-4">
      <header className="mb-6">
        <Link href={`/orders/${orderId}`} className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}>
          ← Order
        </Link>
      </header>
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle>Submit feedback</CardTitle>
          <CardDescription>Rate your experience for this order.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {validationError && (
              <p className="text-sm text-destructive" role="alert">
                {validationError}
              </p>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">Rating (1–5)</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="message" className="text-sm font-medium">
                Message (optional)
              </label>
              <Input
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Any comments?"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={submitFeedback.isPending}>
                {submitFeedback.isPending ? 'Submitting…' : 'Submit'}
              </Button>
              <Link href={`/orders/${orderId}`} className={cn(buttonVariants({ variant: 'outline' }))}>
                Cancel
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
