-- ServiceArea: add branchId (one pincode per branch, pincode unique globally)
ALTER TABLE "ServiceArea" ADD COLUMN IF NOT EXISTS "branchId" TEXT;

-- Ensure at least one branch exists for backfill
INSERT INTO "Branch" ("id", "name", "address", "phone", "footerNote", "logoUrl", "upiId", "upiPayeeName", "upiLink", "upiQrUrl", "isDefault", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'Default', 'TBD', NULL, NULL, NULL, NULL, NULL, NULL, NULL, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Branch" LIMIT 1);

-- Backfill ServiceArea: assign all to first branch
UPDATE "ServiceArea" SET "branchId" = (SELECT "id" FROM "Branch" LIMIT 1)
WHERE "branchId" IS NULL;

-- Make branchId required and add FK
ALTER TABLE "ServiceArea" ALTER COLUMN "branchId" SET NOT NULL;
CREATE INDEX IF NOT EXISTS "ServiceArea_branchId_idx" ON "ServiceArea"("branchId");
ALTER TABLE "ServiceArea" ADD CONSTRAINT "ServiceArea_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Holiday: branchId nullable (null = common for all branches)
ALTER TABLE "Holiday" ADD COLUMN IF NOT EXISTS "branchId" TEXT;
DROP INDEX IF EXISTS "Holiday_date_key";
CREATE UNIQUE INDEX IF NOT EXISTS "Holiday_date_branchId_key" ON "Holiday"("date", "branchId");
CREATE INDEX IF NOT EXISTS "Holiday_branchId_idx" ON "Holiday"("branchId");

-- OperatingHours: per-branch (branchId nullable = default/legacy)
ALTER TABLE "OperatingHours" ADD COLUMN IF NOT EXISTS "branchId" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "OperatingHours_branchId_key" ON "OperatingHours"("branchId");
-- Migrate existing single row: ensure id is uuid-compatible; existing row keeps branchId null
-- No FK to Branch to avoid requiring Branch for legacy row

-- SlotConfig: branchId nullable for now
ALTER TABLE "SlotConfig" ADD COLUMN IF NOT EXISTS "branchId" TEXT;
CREATE INDEX IF NOT EXISTS "SlotConfig_branchId_idx" ON "SlotConfig"("branchId");
