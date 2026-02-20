-- Invoice: orderId nullable (for subscription invoices)
ALTER TABLE "Invoice" ALTER COLUMN "orderId" DROP NOT NULL;

-- Invoice: clear subscriptionId on non-SUBSCRIPTION invoices so we can add unique (subscriptionId, type)
UPDATE "Invoice" SET "subscriptionId" = NULL WHERE "type" != 'SUBSCRIPTION' OR "type" IS NULL;
-- One SUBSCRIPTION invoice per subscription
CREATE UNIQUE INDEX "Invoice_subscriptionId_type_key" ON "Invoice"("subscriptionId", "type");

-- Payment: orderId nullable, add subscriptionId
ALTER TABLE "Payment" ALTER COLUMN "orderId" DROP NOT NULL;
ALTER TABLE "Payment" ADD COLUMN "subscriptionId" TEXT;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE UNIQUE INDEX "Payment_subscriptionId_key" ON "Payment"("subscriptionId");
