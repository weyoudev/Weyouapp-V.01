/**
 * Normalize "H:MM" or "HH:MM" to "HH:MM" for string comparison.
 */
function toHHMM(s: string): string {
  const [h, m] = s.split(':');
  return `${h!.padStart(2, '0')}:${m ?? '00'}`;
}

/**
 * Check if a time window string (e.g. "10:00-12:00") falls within operating hours (e.g. "09:00" to "18:00").
 */
export function isTimeWindowWithin(
  operatingStart: string,
  operatingEnd: string,
  timeWindow: string,
): boolean {
  const match = timeWindow.match(/^(\d{1,2}:\d{2})-(\d{1,2}:\d{2})$/);
  if (!match) return false;
  const [, winStart, winEnd] = match;
  const os = toHHMM(operatingStart);
  const oe = toHHMM(operatingEnd);
  return toHHMM(winStart!) >= os && toHHMM(winEnd!) <= oe;
}
