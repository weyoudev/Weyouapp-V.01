/**
 * Compute slot start datetime in Asia/Kolkata (IST, UTC+5:30).
 * Used to validate that pickup slot is not in the past.
 */

const INDIA_OFFSET_MINUTES = 5.5 * 60;

/**
 * Parse timeWindow string (e.g. "10:00-12:00") and return start hour and minute.
 * Returns null if format is invalid.
 */
function parseTimeWindowStart(timeWindow: string): { hour: number; minute: number } | null {
  const match = timeWindow.match(/^(\d{1,2}):(\d{2})-\d{1,2}:\d{2}$/);
  if (!match) return null;
  const hour = Math.min(23, Math.max(0, parseInt(match[1]!, 10)));
  const minute = Math.min(59, Math.max(0, parseInt(match[2]!, 10)));
  return { hour, minute };
}

/**
 * Given a pickup date (Date or yyyy-mm-dd string) and timeWindow (e.g. "10:00-12:00"),
 * return the slot start as a Date in UTC that corresponds to that local time in India.
 */
export function getSlotStartInIndia(pickupDate: Date | string, timeWindow: string): Date | null {
  const parsed = parseTimeWindowStart(timeWindow);
  if (!parsed) return null;

  const d = typeof pickupDate === 'string' ? new Date(pickupDate) : pickupDate;
  if (Number.isNaN(d.getTime())) return null;

  const y = d.getUTCFullYear();
  const m = d.getUTCMonth();
  const day = d.getUTCDate();

  // India local start: (day at 00:00 India) + hour*60 + minute minutes
  // 00:00 India = UTC - 5h30 = -330 minutes from midnight UTC for that date
  const indiaMidnightUtc = Date.UTC(y, m, day);
  const startMinutesFromMidnight = parsed.hour * 60 + parsed.minute;
  const utcMs = indiaMidnightUtc + (startMinutesFromMidnight - INDIA_OFFSET_MINUTES) * 60 * 1000;
  return new Date(utcMs);
}
