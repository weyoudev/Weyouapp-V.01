import { addDays } from 'date-fns';

// Asia/Kolkata is UTC+5:30 with no DST. We approximate local dates
// by applying a fixed offset from current UTC time.

const INDIA_OFFSET_MINUTES = 5.5 * 60;
const MS_PER_MINUTE = 60 * 1000;

export function getIndiaDates() {
  const now = new Date();
  const indiaTime = new Date(
    now.getTime() + INDIA_OFFSET_MINUTES * MS_PER_MINUTE,
  );

  const year = indiaTime.getUTCFullYear();
  const month = indiaTime.getUTCMonth(); // 0-based
  const day = indiaTime.getUTCDate();

  const todayDate = new Date(Date.UTC(year, month, day));
  const tomorrowDate = addDays(todayDate, 1);

  const todayStr = formatDateYYYYMMDD(todayDate);
  const tomorrowStr = formatDateYYYYMMDD(tomorrowDate);

  return { todayDate, tomorrowDate, todayStr, tomorrowStr };
}

export function getIndiaNowPlusDays(days: number): Date {
  const now = new Date();
  const indiaTime = new Date(
    now.getTime() + INDIA_OFFSET_MINUTES * MS_PER_MINUTE,
  );
  return addDays(indiaTime, days);
}

function formatDateYYYYMMDD(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

