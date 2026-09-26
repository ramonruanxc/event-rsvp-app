import { getTranslations } from 'next-intl/server';
import { removeRsvpAction } from '@/app/[locale]/e/[slug]/actions';
import { cx } from '@/lib/cx';
import { formatShortDateTime } from '@/lib/format-date';
import type { EventPageView } from '@/services/get-event-page';
import { StatusPill } from '@/components/ui/status-pill';
import { RemoveRsvpButton } from './remove-rsvp-button';

/** Props of {@link OwnerGuestList}. */
export interface OwnerGuestListProps {
  view: Extract<EventPageView, { role: 'owner' }>;
  locale: string;
}

/** The owner's guest list: totals and one row per RSVP with a Remove button (REQ-34, REQ-30, REQ-85). */
export async function OwnerGuestList({ view, locale }: OwnerGuestListProps) {
  const t = await getTranslations();

  return (
    <section aria-labelledby="guest-list-heading">
      <div className="guest-head">
        <h2 className="h2" id="guest-list-heading" tabIndex={-1}>
          {t('event.guestList')}
        </h2>
        <p className="small totals">
          {t('totals.summary', {
            going: view.totals.going,
            declined: view.totals.declined,
            people: view.totals.people,
          })}
        </p>
      </div>
      {view.rsvps.length === 0 ? (
        <p className="muted">{t('event.noRsvps')}</p>
      ) : (
        <table className="guests">
          <thead>
            <tr>
              <th scope="col">{t('event.colName')}</th>
              <th scope="col">{t('event.colResponse')}</th>
              <th scope="col" className="c-people">
                {t('event.colPeople')}
              </th>
              <th scope="col">{t('event.colUpdated')}</th>
              <th scope="col">
                <span className="sr-only">{t('event.actions')}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {view.rsvps.map((row) => (
              <tr key={row.id}>
                <td className="c-name">{row.name}</td>
                <td className="c-resp">
                  {row.status === 'GOING' ? (
                    <StatusPill status="going">{t('rsvp.going')}</StatusPill>
                  ) : (
                    <StatusPill status="declined">{t('event.declined')}</StatusPill>
                  )}
                </td>
                <td className={cx('c-people', row.partySize === 0 && 'is-zero')}>
                  <span className="num">{row.partySize}</span>
                  <span className="ph"> {t('event.peopleSuffix', { count: row.partySize })}</span>
                </td>
                <td className="c-upd">
                  <span className="ph">{t('event.updatedPrefix')} </span>
                  {formatShortDateTime(row.updatedAt, view.event.timezone, locale)}
                </td>
                <td className="c-rm">
                  <RemoveRsvpButton
                    name={row.name}
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
