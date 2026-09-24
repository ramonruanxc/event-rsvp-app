import { getTranslations } from 'next-intl/server';
import { removeRsvpAction } from '@/app/[locale]/e/[slug]/actions';
import { formatEventDateTime } from '@/lib/format-date';
import type { EventPageView } from '@/services/get-event-page';
import { RemoveRsvpButton } from './remove-rsvp-button';

/** Props of {@link OwnerGuestList}. */
export interface OwnerGuestListProps {
  view: Extract<EventPageView, { role: 'owner' }>;
  locale: string;
}

/** The owner's guest list: totals and one row per RSVP with a Remove button (REQ-34, REQ-30). */
export async function OwnerGuestList({ view, locale }: OwnerGuestListProps) {
  const t = await getTranslations();

  return (
    <section>
      <h2>{t('event.guestList')}</h2>
      <p>
        {t('totals.summary', {
          going: view.totals.going,
          declined: view.totals.declined,
          people: view.totals.people,
        })}
      </p>
      {view.rsvps.length === 0 ? (
        <p>{t('event.noRsvps')}</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>{t('event.colName')}</th>
              <th>{t('event.colResponse')}</th>
              <th>{t('event.colPeople')}</th>
              <th>{t('event.colUpdated')}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {view.rsvps.map((row) => (
              <tr key={row.id}>
                <td>{row.name}</td>
                <td>{row.status === 'GOING' ? t('rsvp.going') : t('rsvp.notGoing')}</td>
                <td>{row.partySize}</td>
                <td>{formatEventDateTime(row.updatedAt, view.event.timezone, locale)}</td>
                <td>
                  <RemoveRsvpButton
                    removeAction={removeRsvpAction.bind(null, view.event.slug, row.id)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
