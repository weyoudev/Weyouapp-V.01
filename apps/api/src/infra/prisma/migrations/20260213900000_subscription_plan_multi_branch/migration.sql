-- CreateTable: SubscriptionPlanBranch (planId, branchId) for multi-branch plans
CREATE TABLE "SubscriptionPlanBranch" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubscriptionPlanBranch_pkey" PRIMARY KEY ("id")
);

-- Migrate existing single branchId into junction: one row per plan that had a branchId
INSERT INTO "SubscriptionPlanBranch" ("id", "planId", "branchId", "createdAt")
SELECT gen_random_uuid(), "id", "branchId", NOW()
FROM "SubscriptionPlan"
WHERE "branchId" IS NOT NULL;

-- Drop FK and column from SubscriptionPlan
ALTER TABLE "SubscriptionPlan" DROP CONSTRAINT IF EXISTS "SubscriptionPlan_branchId_fkey";
ALTER TABLE "SubscriptionPlan" DROP COLUMN IF EXISTS "branchId";

-- Unique and indexes for SubscriptionPlanBranch
CREATE UNIQUE INDEX "SubscriptionPlanBranch_planId_branchId_key" ON "SubscriptionPlanBranch"("planId", "branchId");
CREATE INDEX "SubscriptionPlanBranch_planId_idx" ON "SubscriptionPlanBranch"("planId");
CREATE INDEX "SubscriptionPlanBranch_branchId_idx" ON "SubscriptionPlanBranch"("branchId");

-- Add FKs
ALTER TABLE "SubscriptionPlanBranch" ADD CONSTRAINT "SubscriptionPlanBranch_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SubscriptionPlanBranch" ADD CONSTRAINT "SubscriptionPlanBranch_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
