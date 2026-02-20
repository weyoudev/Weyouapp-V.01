-- Backend expansion: Invoice ACK/FINAL, Subscription variants/limits, LaundryItem, OrderItem, Branding UPI, User name/notes

-- New enums
CREATE TYPE "InvoiceType" AS ENUM ('ACKNOWLEDGEMENT', 'FINAL');
CREATE TYPE "SubscriptionVariant" AS ENUM ('SINGLE', 'COUPLE', 'FAMILY');
ALTER TYPE "PaymentProvider" ADD VALUE 'UPI';

-- InvoiceStatus: replace FINAL with ISSUED, VOID (new type for migration)
CREATE TYPE "InvoiceStatusNew" AS ENUM ('DRAFT', 'ISSUED', 'VOID');

-- User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "name" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "notes" TEXT;

-- LaundryItem + LaundryItemPrice
CREATE TABLE "LaundryItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LaundryItem_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "LaundryItem_name_key" ON "LaundryItem"("name");

CREATE TABLE "LaundryItemPrice" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "serviceType" "ServiceType" NOT NULL,
    "unitPricePaise" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LaundryItemPrice_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "LaundryItemPrice_itemId_serviceType_key" ON "LaundryItemPrice"("itemId", "serviceType");
CREATE INDEX "LaundryItemPrice_itemId_idx" ON "LaundryItemPrice"("itemId");
ALTER TABLE "LaundryItemPrice" ADD CONSTRAINT "LaundryItemPrice_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "LaundryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- SubscriptionPlan: variant, maxPickups (from totalPickups), itemsLimit, pricePaise; minKgPerPickup nullable
ALTER TABLE "SubscriptionPlan" ADD COLUMN IF NOT EXISTS "variant" "SubscriptionVariant";
ALTER TABLE "SubscriptionPlan" ADD COLUMN IF NOT EXISTS "maxPickups" INTEGER;
ALTER TABLE "SubscriptionPlan" ADD COLUMN IF NOT EXISTS "itemsLimit" INTEGER;
ALTER TABLE "SubscriptionPlan" ADD COLUMN IF NOT EXISTS "pricePaise" INTEGER;
UPDATE "SubscriptionPlan" SET "variant" = 'SINGLE' WHERE "variant" IS NULL;
UPDATE "SubscriptionPlan" SET "maxPickups" = "totalPickups" WHERE "maxPickups" IS NULL;
UPDATE "SubscriptionPlan" SET "pricePaise" = 0 WHERE "pricePaise" IS NULL;
ALTER TABLE "SubscriptionPlan" ALTER COLUMN "variant" SET NOT NULL;
ALTER TABLE "SubscriptionPlan" ALTER COLUMN "maxPickups" SET NOT NULL;
ALTER TABLE "SubscriptionPlan" ALTER COLUMN "pricePaise" SET NOT NULL;
ALTER TABLE "SubscriptionPlan" ALTER COLUMN "minKgPerPickup" DROP NOT NULL;
ALTER TABLE "SubscriptionPlan" DROP COLUMN IF EXISTS "totalPickups";

-- Subscription: usedKg, usedItemsCount
ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "usedKg" DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "usedItemsCount" INTEGER NOT NULL DEFAULT 0;

-- SubscriptionUsage: deductedKg, deductedItemsCount
ALTER TABLE "SubscriptionUsage" ADD COLUMN IF NOT EXISTS "deductedKg" DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE "SubscriptionUsage" ADD COLUMN IF NOT EXISTS "deductedItemsCount" INTEGER NOT NULL DEFAULT 0;

-- OrderItem
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "laundryItemId" TEXT,
    "serviceType" "ServiceType" NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "estimatedWeightKg" DECIMAL(10,2),
    "actualWeightKg" DECIMAL(10,2),
    "unitPricePaise" INTEGER,
    "amountPaise" INTEGER,
    "notes" TEXT,
    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_laundryItemId_fkey" FOREIGN KEY ("laundryItemId") REFERENCES "LaundryItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Invoice: type, issuedAt, discountPaise; status -> new enum; unique (orderId, type)
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "type" "InvoiceType";
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "issuedAt" TIMESTAMP(3);
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "discountPaise" INTEGER;
UPDATE "Invoice" SET "type" = 'FINAL' WHERE "type" IS NULL;
ALTER TABLE "Invoice" ALTER COLUMN "type" SET NOT NULL;

ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "statusNew" "InvoiceStatusNew";
UPDATE "Invoice" SET "statusNew" = CASE WHEN "status"::text = 'FINAL' THEN 'ISSUED'::"InvoiceStatusNew" ELSE 'DRAFT'::"InvoiceStatusNew" END;
ALTER TABLE "Invoice" DROP COLUMN "status";
ALTER TABLE "Invoice" RENAME COLUMN "statusNew" TO "status";
ALTER TABLE "Invoice" ALTER COLUMN "status" SET NOT NULL;

DROP TYPE "InvoiceStatus";
ALTER TYPE "InvoiceStatusNew" RENAME TO "InvoiceStatus";

DROP INDEX IF EXISTS "Invoice_orderId_key";
CREATE UNIQUE INDEX "Invoice_orderId_type_key" ON "Invoice"("orderId", "type");
CREATE INDEX IF NOT EXISTS "Invoice_orderId_idx" ON "Invoice"("orderId");

-- BrandingSettings: UPI fields
ALTER TABLE "BrandingSettings" ADD COLUMN IF NOT EXISTS "upiId" TEXT;
ALTER TABLE "BrandingSettings" ADD COLUMN IF NOT EXISTS "upiPayeeName" TEXT;
ALTER TABLE "BrandingSettings" ADD COLUMN IF NOT EXISTS "upiLink" TEXT;
ALTER TABLE "BrandingSettings" ADD COLUMN IF NOT EXISTS "upiQrUrl" TEXT;
