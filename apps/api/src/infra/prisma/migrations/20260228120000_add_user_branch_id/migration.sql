-- AlterTable: User.branchId for Branch Head (OPS) role
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "branchId" TEXT;

-- CreateIndex (optional; FK will create an index in some setups)
CREATE INDEX IF NOT EXISTS "User_branchId_idx" ON "User"("branchId");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'User_branchId_fkey'
  ) THEN
    ALTER TABLE "User" ADD CONSTRAINT "User_branchId_fkey"
      FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
