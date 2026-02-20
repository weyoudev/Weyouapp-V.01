-- CreateTable
CREATE TABLE "Branch" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT,
    "footerNote" TEXT,
    "logoUrl" TEXT,
    "upiId" TEXT,
    "upiPayeeName" TEXT,
    "upiLink" TEXT,
    "upiQrUrl" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LaundryItemBranch" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LaundryItemBranch_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "SubscriptionPlan" ADD COLUMN "branchId" TEXT;

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN "branchId" TEXT;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "branchId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "LaundryItemBranch_itemId_branchId_key" ON "LaundryItemBranch"("itemId", "branchId");

-- CreateIndex
CREATE INDEX "LaundryItemBranch_branchId_idx" ON "LaundryItemBranch"("branchId");

-- CreateIndex
CREATE INDEX "LaundryItemBranch_itemId_idx" ON "LaundryItemBranch"("itemId");

-- CreateIndex
CREATE INDEX "Order_branchId_idx" ON "Order"("branchId");

-- AddForeignKey
ALTER TABLE "LaundryItemBranch" ADD CONSTRAINT "LaundryItemBranch_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "LaundryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LaundryItemBranch" ADD CONSTRAINT "LaundryItemBranch_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionPlan" ADD CONSTRAINT "SubscriptionPlan_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
