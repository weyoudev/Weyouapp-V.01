/**
 * Single source of truth for ACK invoice subscription utilisation preview.
 * Pure functions: no React, no side effects. Used by summary card, green bar, and exceeded warning.
 */

export interface SubscriptionPreviewInput {
  /** Total pickups allowed (pickupLimit). */
  pickupLimit: number;
  /** Pickups already used (usedPickups). */
  usedPickups: number;
  /** Total items allowed; null if plan has no item limit. */
  itemLimit: number | null;
  /** Items already used. */
  usedItems: number;
  /** Total kg allowed; null if plan has no kg limit. */
  kgLimit: number | null;
  /** Kg already used. */
  usedKg: number;
  /** Items entered in ACK form (parsed; use parseAckItems for raw input). */
  ackItems: number;
  /** Kg entered in ACK form (parsed; use parseAckKg for raw input). */
  ackKg: number;
  /** Whether subscription is applied for this ACK (then we deduct 1 pickup). */
  applySubscription: boolean;
}

export interface SubscriptionPreviewResult {
  /** Pickups used after this ACK. */
  previewUsedPickups: number;
  /** Items used after this ACK. */
  previewUsedItems: number;
  /** Kg used after this ACK. */
  previewUsedKg: number;
  /** Pickups remaining after this ACK. */
  previewRemainingPickups: number;
  /** Items remaining after this ACK (null if no item limit). */
  previewRemainingItems: number | null;
  /** Kg remaining after this ACK (null if no kg limit). */
  previewRemainingKg: number | null;
  /** True only when previewRemainingPickups < 0. */
  pickupsExceeded: boolean;
  /** True only when itemLimit exists and previewRemainingItems < 0. */
  itemsExceeded: boolean;
  /** True only when kgLimit exists and previewRemainingKg < 0. */
  kgExceeded: boolean;
}

const ACK_PICKUPS_DEDUCT = 1;

/**
 * Compute preview usage and remaining after this ACK, and exceeded flags.
 * Exceeded = remaining < 0 (not <= 0; exactly 0 is "fully utilized", not exceeded).
 */
export function computeSubscriptionPreview(input: SubscriptionPreviewInput): SubscriptionPreviewResult {
  const {
    pickupLimit,
    usedPickups,
    itemLimit,
    usedItems,
    kgLimit,
    usedKg,
    ackItems,
    ackKg,
    applySubscription,
  } = input;

  const thisAckPickups = applySubscription ? ACK_PICKUPS_DEDUCT : 0;
  const previewUsedPickups = usedPickups + thisAckPickups;
  const previewUsedItems = usedItems + ackItems;
  const previewUsedKg = usedKg + ackKg;

  const previewRemainingPickups = pickupLimit - previewUsedPickups;
  const previewRemainingItems = itemLimit != null ? itemLimit - previewUsedItems : null;
  const previewRemainingKg = kgLimit != null ? kgLimit - previewUsedKg : null;

  const pickupsExceeded = previewRemainingPickups < 0;
  const itemsExceeded = itemLimit != null && previewRemainingItems != null && previewRemainingItems < 0;
  const kgExceeded = kgLimit != null && previewRemainingKg != null && previewRemainingKg < 0;

  return {
    previewUsedPickups,
    previewUsedItems,
    previewUsedKg,
    previewRemainingPickups,
    previewRemainingItems,
    previewRemainingKg,
    pickupsExceeded,
    itemsExceeded,
    kgExceeded,
  };
}

/** Parse Items input: empty => 0, else parseInt; clamp to >= 0. */
export function parseAckItems(value: number | string | ''): number {
  if (value === '' || value === undefined || value === null) return 0;
  const n = typeof value === 'number' ? value : parseInt(String(value), 10);
  if (Number.isNaN(n)) return 0;
  return Math.max(0, n);
}

/** Parse Weight (kg) input: empty => 0, else parseFloat; clamp to >= 0. */
export function parseAckKg(value: number | string | ''): number {
  if (value === '' || value === undefined || value === null) return 0;
  const n = typeof value === 'number' ? value : parseFloat(String(value));
  if (Number.isNaN(n)) return 0;
  return Math.max(0, n);
}
