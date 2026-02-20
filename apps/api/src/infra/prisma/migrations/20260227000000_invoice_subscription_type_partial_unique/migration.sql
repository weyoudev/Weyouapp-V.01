-- Allow multiple ACK/FINAL invoices per subscription (one per order).
-- Keep one SUBSCRIPTION invoice per subscription via partial unique index.
DROP INDEX IF EXISTS "Invoice_subscriptionId_type_key";
CREATE UNIQUE INDEX "Invoice_subscriptionId_type_subscription_key" ON "Invoice"("subscriptionId", "type") WHERE "type" = 'SUBSCRIPTION';
