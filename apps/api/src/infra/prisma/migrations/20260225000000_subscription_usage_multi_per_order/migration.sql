-- Allow multiple subscription usages per order (one per subscription).
-- Drop single orderId unique; add composite unique (orderId, subscriptionId).
ALTER TABLE "SubscriptionUsage" DROP CONSTRAINT IF EXISTS "SubscriptionUsage_orderId_key";
CREATE UNIQUE INDEX IF NOT EXISTS "SubscriptionUsage_orderId_subscriptionId_key" ON "SubscriptionUsage"("orderId", "subscriptionId");
CREATE INDEX IF NOT EXISTS "SubscriptionUsage_orderId_idx" ON "SubscriptionUsage"("orderId");
