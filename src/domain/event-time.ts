import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';

/** Converts a local date and time in a given IANA timezone to a UTC instant. */
export function toStartsAt(date: string, time: string, timeZone: string): Date {
  return fromZonedTime(`${date}T${time}:00`, timeZone);
}

/** Converts a UTC instant back to the local date and time in a given IANA timezone. */
export function toLocalParts(instant: Date, timeZone: string): { date: string; time: string } {
  return {
    date: formatInTimeZone(instant, timeZone, 'yyyy-MM-dd'),
    time: formatInTimeZone(instant, timeZone, 'HH:mm'),
  };
}

/** Adds a number of calendar days to a yyyy-MM-dd date string, using UTC arithmetic (REQ-37). */
export function addDaysToDateString(_date: string, _days: number): string {
  throw new Error('not implemented');
}
