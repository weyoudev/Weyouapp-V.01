-- Add Terms and Conditions to branding (shown on every invoice)
ALTER TABLE "BrandingSettings" ADD COLUMN IF NOT EXISTS "termsAndConditions" TEXT;
