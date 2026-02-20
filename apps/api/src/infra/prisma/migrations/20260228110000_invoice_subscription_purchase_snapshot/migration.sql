-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "subscriptionPurchaseSnapshotJson" JSONB;
