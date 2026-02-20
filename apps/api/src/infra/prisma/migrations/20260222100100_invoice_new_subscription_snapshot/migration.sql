-- AlterTable: store new-subscription intent on invoice (plan + start date); at issue we create subscription and payment
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "newSubscriptionSnapshotJson" JSONB;
