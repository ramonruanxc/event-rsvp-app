/** Options of the event page's full date and time (BR-19, BR-76). */
const EVENT_DATE_TIME: Intl.DateTimeFormatOptions = {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZoneName: 'short',
};

/** Formats an instant in the event's timezone, for the given UI locale, with a timezone label (BR-19, BR-76). */
export function formatEventDateTime(instant: Date, timeZone: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { ...EVENT_DATE_TIME, timeZone }).format(instant);
}

/** The three parts shown on a dashboard row's decorative date tile (REQ-82). */
export interface DateTileParts {
  month: string;
  day: string;
  weekday: string;
}

/** Splits an instant into upper-case short month, day and short weekday in the event timezone (REQ-82). */
export function dateTileParts(instant: Date, timeZone: string, locale: string): DateTileParts {
  const part = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(locale, { ...options, timeZone }).format(instant);
  return {
    month: part({ month: 'short' }).toUpperCase(),
    day: part({ day: 'numeric' }),
    weekday: part({ weekday: 'short' }),
  };
}

/** Formats an instant as a short date-time with a timezone label, for dashboard rows (REQ-85). */
export function formatShortDateTime(instant: Date, timeZone: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone,
    timeZoneName: 'short',
  }).format(instant);
}

/** The event date and time split before the hour, so the time and zone can be kept on one line (REQ-151). */
export interface EventDateTimeParts {
  date: string;
  time: string;
}

/** Splits {@link formatEventDateTime}'s text into the date part and the time-of-day + zone part (REQ-151, BR-184). */
export function formatEventDateTimeParts(
  instant: Date,
  timeZone: string,
  locale: string,
): EventDateTimeParts {
  const parts = new Intl.DateTimeFormat(locale, { ...EVENT_DATE_TIME, timeZone }).formatToParts(
    instant,
  );
  const join = (list: Intl.DateTimeFormatPart[]) => list.map((part) => part.value).join('');
  const hour = parts.findIndex((part) => part.type === 'hour');
  if (hour < 0) return { date: join(parts), time: '' };
  return { date: join(parts.slice(0, hour)), time: join(parts.slice(hour)) };
}
