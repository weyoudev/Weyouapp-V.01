-- Add effective limits on Subscription for quantity/extend (multiply by months)
ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "totalMaxPickups" INTEGER;
ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "totalKgLimit" DECIMAL(10,2);
ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "totalItemsLimit" INTEGER;
