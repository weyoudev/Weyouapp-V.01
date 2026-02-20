-- AlterTable: Subscription.validityStartDate
ALTER TABLE "Subscription" ADD COLUMN "validityStartDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable: Order.serviceTypes for multi-select
ALTER TABLE "Order" ADD COLUMN "serviceTypes" "ServiceType"[] DEFAULT ARRAY[]::"ServiceType"[];

-- Backfill: existing orders get serviceTypes = [serviceType]
UPDATE "Order" SET "serviceTypes" = ARRAY["serviceType"]::"ServiceType"[] WHERE cardinality("serviceTypes") = 0;
