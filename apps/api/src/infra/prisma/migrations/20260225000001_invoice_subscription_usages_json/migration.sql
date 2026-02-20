ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "subscriptionUsagesJson" JSONB;
