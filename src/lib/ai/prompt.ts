import { formatInTimeZone } from 'date-fns-tz';

/** Builds the reference line the AI uses to resolve relative dates in the organizer's local day (REQ-44, BR-62). */
export function buildReferenceLine(now: Date, timeZone: string | null): string {
  const formatted = formatInTimeZone(now, timeZone ?? 'UTC', 'EEEE yyyy-MM-dd HH:mm');
  return timeZone === null
    ? `Today is ${formatted}, UTC. The organizer's timezone is unknown.`
    : `Today is ${formatted}, ${timeZone}.`;
}
