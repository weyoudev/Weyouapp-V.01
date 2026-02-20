-- CreateEnum
CREATE TYPE "InvoiceOrderMode" AS ENUM ('INDIVIDUAL', 'SUBSCRIPTION_ONLY', 'BOTH');

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN "orderMode" "InvoiceOrderMode" NOT NULL DEFAULT 'INDIVIDUAL';
