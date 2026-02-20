/**
 * Clear ALL application data from the database (no tables dropped).
 * Use when you want a completely fresh start. Does NOT touch prisma_migrations.
 * Requires: RESET_ALL_CONFIRM=YES
 *
 * After running:
 * - Run bootstrap or seed to recreate admin + master data.
 *
 * Run from repo root:
 *   RESET_ALL_CONFIRM=YES npx ts-node --transpile-only --project scripts/tsconfig.seed.json scripts/reset-all-data.ts
 * Or: RESET_ALL_CONFIRM=YES npm run reset:all
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetAll(): Promise<void> {
  if (process.env.RESET_ALL_CONFIRM !== 'YES') {
    console.error('Aborted: set RESET_ALL_CONFIRM=YES to clear all data.');
    process.exit(1);
  }

  console.log('Clearing ALL application data (FK-safe order)...');

  await prisma.$transaction(async (tx) => {
    // Transactional / customer (children first)
    await tx.feedback.deleteMany({});
    await tx.invoiceItem.deleteMany({});
    await tx.invoice.deleteMany({});
    await tx.payment.deleteMany({});
    await tx.subscriptionUsage.deleteMany({});
    await tx.orderItem.deleteMany({});
    await tx.order.deleteMany({});
    await tx.subscription.deleteMany({});
    await tx.address.deleteMany({});
    await tx.user.deleteMany({});

    // Master / config (dependents first)
    await tx.slotConfig.deleteMany({});
    await tx.holiday.deleteMany({});
    await tx.operatingHours.deleteMany({});
    await tx.serviceArea.deleteMany({});
    await tx.laundryItemBranch.deleteMany({});
    await tx.laundryItemPrice.deleteMany({});
    await tx.itemSegmentServicePrice.deleteMany({});
    await tx.subscriptionPlanBranch.deleteMany({});
    await tx.dryCleanItem.deleteMany({});
    await tx.servicePriceConfig.deleteMany({});
    await tx.laundryItem.deleteMany({});
    await tx.serviceCategory.deleteMany({});
    await tx.segmentCategory.deleteMany({});
    await tx.subscriptionPlan.deleteMany({});
    await tx.branch.deleteMany({});
    await tx.brandingSettings.deleteMany({});
  });

  console.log('All application data cleared. Run seed or bootstrap to add fresh data.');
}

resetAll()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
