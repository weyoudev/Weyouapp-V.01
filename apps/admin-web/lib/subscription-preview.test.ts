/**
 * Unit tests for ACK subscription preview (single source of truth).
 */
import { computeSubscriptionPreview, parseAckItems, parseAckKg } from './subscription-preview';

const base = {
  pickupLimit: 4,
  usedPickups: 0,
  itemLimit: 20,
  usedItems: 0,
  kgLimit: null as number | null,
  usedKg: 0,
  ackItems: 0,
  ackKg: 0,
  applySubscription: true,
};

describe('computeSubscriptionPreview', () => {
  it('Case 1: remaining items 20, ackItems=8 => not exceeded', () => {
    const r = computeSubscriptionPreview({
      ...base,
      itemLimit: 20,
      usedItems: 0,
      ackItems: 8,
      applySubscription: true,
    });
    expect(r.previewUsedItems).toBe(8);
    expect(r.previewRemainingItems).toBe(12);
    expect(r.itemsExceeded).toBe(false);
  });

  it('Case 2: remaining items 5, ackItems=8 => exceeded', () => {
    const r = computeSubscriptionPreview({
      ...base,
      itemLimit: 20,
      usedItems: 15,
      ackItems: 8,
      applySubscription: true,
    });
    expect(r.previewUsedItems).toBe(23);
    expect(r.previewRemainingItems).toBe(-3);
    expect(r.itemsExceeded).toBe(true);
  });

  it('Case 3: remaining items 8, ackItems=8 => remaining = 0 (not exceeded)', () => {
    const r = computeSubscriptionPreview({
      ...base,
      itemLimit: 20,
      usedItems: 12,
      ackItems: 8,
      applySubscription: true,
    });
    expect(r.previewUsedItems).toBe(20);
    expect(r.previewRemainingItems).toBe(0);
    expect(r.itemsExceeded).toBe(false);
  });

  it('Case 4: ackItems empty => treated as 0', () => {
    const r = computeSubscriptionPreview({
      ...base,
      ackItems: 0,
      applySubscription: true,
    });
    expect(r.previewUsedItems).toBe(0);
    expect(r.itemsExceeded).toBe(false);
  });

  it('Case 5: applySubscription=false => no pickup deduction in preview', () => {
    const r = computeSubscriptionPreview({
      ...base,
      usedPickups: 2,
      applySubscription: false,
    });
    expect(r.previewUsedPickups).toBe(2);
    expect(r.previewRemainingPickups).toBe(2);
  });

  it('applySubscription=true deducts 1 pickup', () => {
    const r = computeSubscriptionPreview({
      ...base,
      usedPickups: 1,
      applySubscription: true,
    });
    expect(r.previewUsedPickups).toBe(2);
    expect(r.previewRemainingPickups).toBe(2);
  });

  it('kg: remaining 10, ackKg=5 => not exceeded', () => {
    const r = computeSubscriptionPreview({
      ...base,
      itemLimit: null,
      kgLimit: 52,
      usedKg: 42,
      ackKg: 5,
      ackItems: 0,
    });
    expect(r.previewRemainingKg).toBe(5);
    expect(r.kgExceeded).toBe(false);
  });

  it('kg: ackKg exceeds remaining => exceeded', () => {
    const r = computeSubscriptionPreview({
      ...base,
      itemLimit: null,
      kgLimit: 52,
      usedKg: 50,
      ackKg: 5,
      ackItems: 0,
    });
    expect(r.previewRemainingKg).toBe(-3);
    expect(r.kgExceeded).toBe(true);
  });
});

describe('parseAckItems', () => {
  it('empty string => 0', () => {
    expect(parseAckItems('')).toBe(0);
  });
  it('number 8 => 8', () => {
    expect(parseAckItems(8)).toBe(8);
  });
  it('string "8" => 8', () => {
    expect(parseAckItems('8')).toBe(8);
  });
  it('negative => 0 (clamped)', () => {
    expect(parseAckItems(-5)).toBe(0);
  });
  it('NaN string => 0', () => {
    expect(parseAckItems('x')).toBe(0);
  });
});

describe('parseAckKg', () => {
  it('empty string => 0', () => {
    expect(parseAckKg('')).toBe(0);
  });
  it('number 2.5 => 2.5', () => {
    expect(parseAckKg(2.5)).toBe(2.5);
  });
  it('string "2.5" => 2.5', () => {
    expect(parseAckKg('2.5')).toBe(2.5);
  });
  it('negative => 0 (clamped)', () => {
    expect(parseAckKg(-1)).toBe(0);
  });
});
