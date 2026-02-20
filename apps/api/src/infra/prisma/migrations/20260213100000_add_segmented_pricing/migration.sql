-- CreateEnum
CREATE TYPE "Segment" AS ENUM ('MEN', 'WOMEN', 'KIDS', 'HOME_LINEN');

-- CreateTable
CREATE TABLE "ServiceCategory" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ServiceCategory_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ServiceCategory_code_key" ON "ServiceCategory"("code");

-- CreateTable
CREATE TABLE "ItemSegmentServicePrice" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "segment" "Segment" NOT NULL,
    "serviceCategoryId" TEXT NOT NULL,
    "priceRupees" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ItemSegmentServicePrice_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ItemSegmentServicePrice_itemId_segment_serviceCategoryId_key" ON "ItemSegmentServicePrice"("itemId", "segment", "serviceCategoryId");
CREATE INDEX "ItemSegmentServicePrice_itemId_idx" ON "ItemSegmentServicePrice"("itemId");
CREATE INDEX "ItemSegmentServicePrice_serviceCategoryId_idx" ON "ItemSegmentServicePrice"("serviceCategoryId");
ALTER TABLE "ItemSegmentServicePrice" ADD CONSTRAINT "ItemSegmentServicePrice_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "LaundryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ItemSegmentServicePrice" ADD CONSTRAINT "ItemSegmentServicePrice_serviceCategoryId_fkey" FOREIGN KEY ("serviceCategoryId") REFERENCES "ServiceCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
