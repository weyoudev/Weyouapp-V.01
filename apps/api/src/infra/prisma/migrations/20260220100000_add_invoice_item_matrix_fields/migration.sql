-- AlterTable (IF NOT EXISTS for idempotency if columns were added manually or by another run)
ALTER TABLE "InvoiceItem" ADD COLUMN IF NOT EXISTS "catalogItemId" TEXT;
ALTER TABLE "InvoiceItem" ADD COLUMN IF NOT EXISTS "segmentCategoryId" TEXT;
ALTER TABLE "InvoiceItem" ADD COLUMN IF NOT EXISTS "serviceCategoryId" TEXT;
