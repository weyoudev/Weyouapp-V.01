-- Remove default/fallback operating hours (branchId IS NULL). Branch timings are per-branch only.
DELETE FROM "OperatingHours" WHERE "branchId" IS NULL;
