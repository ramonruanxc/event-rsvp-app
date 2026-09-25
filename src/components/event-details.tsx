import { Calendar, CalendarPlus, MapPin, Users } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { formatEventDateTime } from '@/lib/format-date';
import type { EventRecord, Totals } from '@/domain/types';
import { buttonClass } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { StatusPill } from '@/components/ui/status-pill';

/** Props of {@link EventDetails}. */
export interface EventDetailsProps {
  event: EventRecord;
  totals: Totals;
  locale: string;
  ended: boolean;
}

/** Read-only presentation of an event's name, description, time, location and RSVP count (REQ-15, REQ-84). */
export async function EventDetails({ event, totals, locale, ended }: EventDetailsProps) {
  const t = await getTranslations();
  return (
    <div className="ev-head">
      {ended && (
        <div className="status-row">
          <StatusPill status="ended">{t('event.endedPill')}</StatusPill>
        </div>
      )}
      <h1 className="display">{event.name}</h1>
      <ul className="meta-list">
        <li>
          <Icon icon={Calendar} />
          <span className="num">{formatEventDateTime(event.startsAt, event.timezone, locale)}</span>
        </li>
        {event.location && (
          <li>
            <Icon icon={MapPin} />
            <span>{event.location}</span>
          </li>
        )}
      </ul>
      <p className="ev-desc prose whitespace-pre-wrap">{event.description}</p>
      <div className="ev-sub">
        <span className="going-count">
          <Icon icon={Users} />
          {t('totals.peopleGoing', { count: totals.people })}
        </span>
        <a className={buttonClass('secondary')} href={`/e/${event.slug}/calendar.ics`} download>
          <Icon icon={CalendarPlus} />
          {t('event.addToCalendar')}
        </a>
      </div>
    </div>
  );
}
