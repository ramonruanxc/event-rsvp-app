import { formatInTimeZone } from 'date-fns-tz';

/** Builds the reference line the AI uses to resolve relative dates in the organizer's local day (REQ-44, BR-62). */
export function buildReferenceLine(now: Date, timeZone: string | null): string {
  const formatted = formatInTimeZone(now, timeZone ?? 'UTC', 'EEEE yyyy-MM-dd HH:mm');
  return timeZone === null
    ? `Today is ${formatted}, UTC. The organizer's timezone is unknown.`
    : `Today is ${formatted}, ${timeZone}.`;
}

/** Instructions given to the model for every "Fill with AI" call (REQ-44, BR-55, BR-62, BR-63, BR-69, BR-96). */
export const SYSTEM_PROMPT = '';

/** Builds the user message: the reference line followed by the organizer's text delimited once (REQ-44, BR-69). */
export function buildUserMessage(_input: {
  text: string;
  now: Date;
  timezone: string | null;
}): string {
  throw new Error('not implemented');
}
