import { getTranslations } from 'next-intl/server';
import { formatEventDateTime } from '@/lib/format-date';
import type { EventRecord, Totals } from '@/domain/types';

/** Props of {@link EventDetails}. */
export interface EventDetailsProps {
  event: EventRecord;
  totals: Totals;
  locale: string;
}

/** Read-only presentation of an event's name, description, time, location and RSVP count (REQ-15). */
export async function EventDetails({ event, totals, locale }: EventDetailsProps) {
  const t = await getTranslations();
  return (
    <>
      <h1>{event.name}</h1>
      <p className="whitespace-pre-wrap">{event.description}</p>
      <p>{formatEventDateTime(event.startsAt, event.timezone, locale)}</p>
      {event.location && <p>{event.location}</p>}
      <p>{t('totals.peopleGoing', { count: totals.people })}</p>
      <a href={`/e/${event.slug}/calendar.ics`} download>
        {t('event.addToCalendar')}
      </a>
    </>
  );
}
