/**
 * One-time repair: detect duplicate SubscriptionUsage rows for the same (orderId, subscriptionId)
 * or (invoiceId, subscriptionId), keep the first, revert the extra deduction from Subscription, then delete the duplicate row(s).
 *
 * Run from repo root: npx ts-node -r tsconfig-paths/register apps/api/scripts/repair-duplicate-ack-usage.ts
 * Or with Prisma: use the Prisma client from your app (inject or instantiate) and run the queries below.
 *
 * Logic (pseudo):
 * 1. Find groups where (orderId, subscriptionId) or (invoiceId, subscriptionId) have count > 1.
 * 2. For each group, order by createdAt asc; keep first row.
 * 3. For each duplicate row: subscription.updateUsage(subId, { usedKg: current - row.deductedKg, ... }); then delete row.
 * 4. Do NOT reset entire subscription history; only undo the duplicate usage rows.
 *
 * Example SQL to find duplicates by orderId+subscriptionId:
 *   SELECT "orderId", "subscriptionId", COUNT(*) FROM "SubscriptionUsage" GROUP BY "orderId", "subscriptionId" HAVING COUNT(*) > 1;
 * Then for each (orderId, subscriptionId), select rows order by "createdAt", keep first, revert and delete the rest.
 */
export function repairDuplicateAckUsageDescription(): string {
  return 'See script comments: find duplicate SubscriptionUsage by (orderId, subscriptionId), keep first, revert subscription and delete duplicates.';
}
