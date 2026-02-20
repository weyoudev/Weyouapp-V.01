-- Add column to track when new subscriptions from ACK have been created (after payment).
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "newSubscriptionFulfilledAt" TIMESTAMP(3);
