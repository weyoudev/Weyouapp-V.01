-- Add orderSource for walk-in orders (WALK_IN = counter order)
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "orderSource" TEXT;
CREATE INDEX IF NOT EXISTS "Order_orderSource_idx" ON "Order"("orderSource");
