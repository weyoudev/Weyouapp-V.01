-- Idempotent: ensure SubscriptionPlan has description and redemptionMode (fixes DBs where an earlier migration was skipped or failed)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'RedemptionMode') THEN
    CREATE TYPE "RedemptionMode" AS ENUM ('MULTI_USE', 'SINGLE_USE');
  END IF;
END $$;

ALTER TABLE "SubscriptionPlan" ADD COLUMN IF NOT EXISTS "description" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'SubscriptionPlan' AND column_name = 'redemptionMode'
  ) THEN
    ALTER TABLE "SubscriptionPlan" ADD COLUMN "redemptionMode" "RedemptionMode" NOT NULL DEFAULT 'MULTI_USE';
  END IF;
END $$;
