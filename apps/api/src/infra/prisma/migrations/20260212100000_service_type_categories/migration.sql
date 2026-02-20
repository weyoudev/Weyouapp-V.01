-- AlterEnum
-- Add new service categories: Steam Ironing, Home Linen, Shoes, Add ons (to match item categorization UI)
ALTER TYPE "ServiceType" ADD VALUE 'STEAM_IRON';
ALTER TYPE "ServiceType" ADD VALUE 'HOME_LINEN';
ALTER TYPE "ServiceType" ADD VALUE 'SHOES';
ALTER TYPE "ServiceType" ADD VALUE 'ADD_ONS';
