-- AlterEnum: add BOTH to OrderType (laundry + subscription; admin assigns plan at ACK)
ALTER TYPE "OrderType" ADD VALUE 'BOTH';
