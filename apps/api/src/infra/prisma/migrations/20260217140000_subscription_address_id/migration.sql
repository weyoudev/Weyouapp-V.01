-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN "addressId" TEXT;

-- CreateIndex
CREATE INDEX "Subscription_addressId_idx" ON "Subscription"("addressId");

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;
