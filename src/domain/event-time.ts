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
