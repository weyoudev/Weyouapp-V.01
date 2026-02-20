# Resolving migration "relation already exists" (P3018)

Your database already has `ServiceCategory` and related tables (from a previous migration or different migration history). Prisma tried to apply `20260213100000_add_segmented_pricing` and failed because it runs `CREATE TABLE "ServiceCategory"` which already exists.

## Steps (run from repo root `E:\WeYouApp`)

Use the schema path that matches your Prisma setup (e.g. `apps/api/src/infra/prisma/schema.prisma` if migrations live there).

### 1. Mark the failed migration as rolled back

This clears the "failed" state so Prisma can move on:

```bash
npx prisma migrate resolve --rolled-back "20260213100000_add_segmented_pricing" --schema=apps/api/src/infra/prisma/schema.prisma
```

### 2. Mark the same migration as applied (without running it)

This tells Prisma the migration is "done" so it won't run it again:

```bash
npx prisma migrate resolve --applied "20260213100000_add_segmented_pricing" --schema=apps/api/src/infra/prisma/schema.prisma
```

### 3. Run migrations again

```bash
npx prisma migrate deploy --schema=apps/api/src/infra/prisma/schema.prisma
```

- If the next migration (`20260213120000_segment_category_table`) fails with "relation SegmentCategory already exists", repeat the same pattern (use the **exact** migration name in quotes):
  - `npx prisma migrate resolve --rolled-back "20260213120000_segment_category_table" --schema=apps/api/src/infra/prisma/schema.prisma`
  - `npx prisma migrate resolve --applied "20260213120000_segment_category_table" --schema=apps/api/src/infra/prisma/schema.prisma`
  - Then run `npx prisma migrate deploy --schema=apps/api/src/infra/prisma/schema.prisma` again.
- The migration `20260213180000_add_branches` (Branch, LaundryItemBranch, branchId columns) should then apply successfully.

## Important: use the real migration name

**MIGRATION_NAME** is a placeholder. Use the **exact folder name** of the migration (the directory under `migrations/`), for example:

- `20260213100000_add_segmented_pricing`
- `20260213120000_segment_category_table`

Never use the literal text `MIGRATION_NAME`.

## For future "already exists" errors

Use the **exact migration folder name** (e.g. `20260213100000_add_segmented_pricing`), not the literal `MIGRATION_NAME`:

```bash
npx prisma migrate resolve --rolled-back "EXACT_MIGRATION_FOLDER_NAME" --schema=apps/api/src/infra/prisma/schema.prisma
npx prisma migrate resolve --applied "EXACT_MIGRATION_FOLDER_NAME" --schema=apps/api/src/infra/prisma/schema.prisma
```

## One-liner (PowerShell) for the first migration

```powershell
cd E:\WeYouApp
npx prisma migrate resolve --rolled-back "20260213100000_add_segmented_pricing" --schema=apps/api/src/infra/prisma/schema.prisma
npx prisma migrate resolve --applied "20260213100000_add_segmented_pricing" --schema=apps/api/src/infra/prisma/schema.prisma
npx prisma migrate deploy --schema=apps/api/src/infra/prisma/schema.prisma
```
