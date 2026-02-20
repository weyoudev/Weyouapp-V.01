/**
 * Returns today's date in India (UTC+5:30) as YYYY-MM-DD for API payloads.
 */
export function getTodayIndiaISO(): string {
  const now = new Date();
  const india = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
  const y = india.getUTCFullYear();
  const m = String(india.getUTCMonth() + 1).padStart(2, '0');
  const d = String(india.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
