-- AlterTable: add description (nullable) and redemptionMode (default MULTI_USE) to SubscriptionPlan
CREATE TYPE "RedemptionMode" AS ENUM ('MULTI_USE', 'SINGLE_USE');

ALTER TABLE "SubscriptionPlan" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "SubscriptionPlan" ADD COLUMN IF NOT EXISTS "redemptionMode" "RedemptionMode" NOT NULL DEFAULT 'MULTI_USE';
