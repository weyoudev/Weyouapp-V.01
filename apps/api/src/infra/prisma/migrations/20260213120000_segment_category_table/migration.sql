-- CreateTable SegmentCategory
CREATE TABLE "SegmentCategory" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SegmentCategory_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "SegmentCategory_code_key" ON "SegmentCategory"("code");

-- Seed default segments (use fixed UUIDs for reproducible migration)
INSERT INTO "SegmentCategory" ("id", "code", "label", "isActive", "createdAt") VALUES
  ('a0000001-seg-men-000000000001', 'MEN', 'Men', true, CURRENT_TIMESTAMP),
  ('a0000002-seg-women-00000000002', 'WOMEN', 'Women', true, CURRENT_TIMESTAMP),
  ('a0000003-seg-kids-000000000003', 'KIDS', 'Kids', true, CURRENT_TIMESTAMP),
  ('a0000004-seg-home-000000000004', 'HOME_LINEN', 'Home Linen', true, CURRENT_TIMESTAMP);

-- Add segmentCategoryId (nullable first)
ALTER TABLE "ItemSegmentServicePrice" ADD COLUMN "segmentCategoryId" TEXT;

-- Backfill: map enum segment to SegmentCategory id
UPDATE "ItemSegmentServicePrice" p
SET "segmentCategoryId" = c.id
FROM "SegmentCategory" c
WHERE c.code = p.segment::text;

-- Make NOT NULL (all existing rows now have segmentCategoryId)
ALTER TABLE "ItemSegmentServicePrice" ALTER COLUMN "segmentCategoryId" SET NOT NULL;

-- Drop old unique index (Prisma creates unique as index)
DROP INDEX IF EXISTS "ItemSegmentServicePrice_itemId_segment_serviceCategoryId_key";

-- Add FK and new unique constraint
ALTER TABLE "ItemSegmentServicePrice" ADD CONSTRAINT "ItemSegmentServicePrice_segmentCategoryId_fkey"
  FOREIGN KEY ("segmentCategoryId") REFERENCES "SegmentCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE UNIQUE INDEX "ItemSegmentServicePrice_itemId_segmentCategoryId_serviceCategoryId_key"
  ON "ItemSegmentServicePrice"("itemId", "segmentCategoryId", "serviceCategoryId");
CREATE INDEX "ItemSegmentServicePrice_segmentCategoryId_idx" ON "ItemSegmentServicePrice"("segmentCategoryId");

-- Drop segment column and enum
ALTER TABLE "ItemSegmentServicePrice" DROP COLUMN "segment";
DROP TYPE "Segment";
