-- AlterTable: Branch GST and PAN numbers
ALTER TABLE "Branch" ADD COLUMN IF NOT EXISTS "gstNumber" TEXT;
ALTER TABLE "Branch" ADD COLUMN IF NOT EXISTS "panNumber" TEXT;
