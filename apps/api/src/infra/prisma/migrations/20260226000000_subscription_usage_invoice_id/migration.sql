-- Add invoiceId to SubscriptionUsage for idempotent ACK deduction (one usage per ACK invoice + subscription).
ALTER TABLE "SubscriptionUsage" ADD COLUMN IF NOT EXISTS "invoiceId" TEXT;

-- Backfill: set invoiceId from the order's ACK invoice so existing rows participate in unique(invoiceId, subscriptionId).
UPDATE "SubscriptionUsage" u
SET "invoiceId" = (
  SELECT i.id FROM "Invoice" i
  WHERE i."orderId" = u."orderId" AND i.type = 'ACKNOWLEDGEMENT'
  LIMIT 1
)
WHERE u."invoiceId" IS NULL;

-- FK and unique constraint
ALTER TABLE "SubscriptionUsage" ADD CONSTRAINT "SubscriptionUsage_invoiceId_fkey"
  FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS "SubscriptionUsage_invoiceId_subscriptionId_key"
  ON "SubscriptionUsage"("invoiceId", "subscriptionId");

CREATE INDEX IF NOT EXISTS "SubscriptionUsage_invoiceId_idx" ON "SubscriptionUsage"("invoiceId");
