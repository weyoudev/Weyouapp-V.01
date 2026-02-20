-- AlterTable: User.expoPushToken for mobile push notifications (CUSTOMER)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "expoPushToken" TEXT;
