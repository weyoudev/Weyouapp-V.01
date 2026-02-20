# Seeded demo data (backend)

This document describes the deterministic data created by `npm run prisma:seed`.

## Users

- **Customer**
  - phone: `+919999999999`
  - role: `CUSTOMER`
- **Admin**
  - email: `admin@laundry.local`
  - passwordHash: `dev-hash` (placeholder)
  - role: `ADMIN`
- **Billing**
  - email: `billing@laundry.local`
  - passwordHash: `dev-hash`
  - role: `BILLING`

## Branding

- **BrandingSettings**
  - businessName: `Laundry Demo`
  - address: `Demo Address`
  - phone: `+91-9000000000`
  - footerNote: `Thank you!`

## Service area

- **ServiceArea**
  - pincode: `500081`
  - active: `true`

## Slots (SlotConfig)

Slots are created relative to **Asia/Kolkata** local dates:

- **Today** (local India date):
  - `10:00-12:00`, capacity `10`, pincode `500081`
  - `14:00-16:00`, capacity `10`, pincode `500081`
- **Tomorrow** (local India date):
  - `10:00-12:00`, capacity `10`, pincode `500081`

## Pricing (ServicePriceConfig)

Money is stored in **paise** (integer minor units).

- `WASH_FOLD`
  - pricingMode: `PER_KG`
  - pricePerKg: `1000` (₹10.00 per kg)
  - minimumKg: `3.00`
  - pickupFee: `0`
  - active: `true`
- `WASH_IRON`
  - pricingMode: `PER_KG`
  - pricePerKg: `1500` (₹15.00 per kg)
  - minimumKg: `3.00`
  - pickupFee: `0`
  - active: `true`

## Dry clean catalog (DryCleanItem)

- `Shirt` — `800` paise
- `Suit` — `2500` paise
- `Dress` — `1800` paise
All `active = true`.

## Subscription plan

- **SubscriptionPlan**
  - name: `Single (12kg) Monthly`
  - validityDays: `30`
  - totalPickups: `2`
  - kgLimit: `12.00`
  - minKgPerPickup: `3.00`
  - applicableServiceTypes: `["WASH_FOLD"]`
  - active: `true`

## Subscription for demo customer

- **Subscription**
  - user: seeded **Customer**
  - plan: `Single (12kg) Monthly`
  - remainingPickups: `2`
  - expiryDate: **now + 30 days** in Asia/Kolkata
  - active: `true`

## Customer address

- **Address** for demo Customer:
  - label: `Home`
  - addressLine: `Demo House, Demo Street`
  - pincode: `500081`
  - isDefault: `true`

## Notes

- The seed script is **idempotent**. Running `npm run prisma:seed` multiple times:
  - does not create duplicate users, service areas, slots, or plans
  - refreshes demo subscription (remainingPickups = 2, expiryDate extended)
- Use `npm run prisma:studio` to explore the seeded data visually.

