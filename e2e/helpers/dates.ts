import { formatInTimeZone } from 'date-fns-tz';

/** Returns the calendar date `days` days from now, formatted `yyyy-MM-dd` in `timeZone`. */
export function futureDate(days: number, timeZone = 'America/New_York'): string {
  const instant = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  return formatInTimeZone(instant, timeZone, 'yyyy-MM-dd');
}
