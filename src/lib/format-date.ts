/** Formats an instant in the event's timezone, for the given UI locale, with a timezone label (BR-19, BR-76). */
export function formatEventDateTime(instant: Date, timeZone: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone,
    timeZoneName: 'short',
  }).format(instant);
}

/** The three parts shown on a dashboard row's decorative date tile (REQ-82). */
export interface DateTileParts {
  month: string;
  day: string;
  weekday: string;
}

/** Splits an instant into upper-case short month, day and short weekday in the event timezone (REQ-82). */
export function dateTileParts(_instant: Date, _timeZone: string, _locale: string): DateTileParts {
  throw new Error('not implemented');
}

/** Formats an instant as a short date-time with a timezone label, for dashboard rows (REQ-85). */
export function formatShortDateTime(_instant: Date, _timeZone: string, _locale: string): string {
  throw new Error('not implemented');
}
