import { getTranslations } from 'next-intl/server';
import { CreateSampleButton } from '@/components/create-sample-button';
import { Link } from '@/i18n/navigation';
import { getServices } from '@/lib/container';
import { requireUserId } from '@/lib/session';
import { formatEventDateTime } from '@/lib/format-date';
import type { DashboardItem } from '@/services/list-dashboard';
import { createSampleEventAction } from './actions';

/** The signed-in organizer's events, split into upcoming and past, with RSVP totals (REQ-36). */
export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const ownerId = await requireUserId(`/${locale}/dashboard`);
  const t = await getTranslations();
  const { upcoming, past } = await getServices().listDashboard.execute({ ownerId });
  const isEmpty = upcoming.length === 0 && past.length === 0;

  function renderItem(item: DashboardItem) {
    return (
      <li key={item.slug}>
        <Link href={`/e/${item.slug}`}>{item.name}</Link>
        <span>{formatEventDateTime(item.startsAt, item.timezone, locale)}</span>
        <span>
          {t('totals.summary', {
            going: item.totals.going,
            declined: item.totals.declined,
            people: item.totals.people,
          })}
        </span>
      </li>
    );
  }

  return (
    <main>
      <h1>{t('dashboard.title')}</h1>
      <Link href="/events/new">{t('dashboard.createEvent')}</Link>

      {isEmpty ? (
        <>
          <p>{t('dashboard.empty')}</p>
          <CreateSampleButton create={createSampleEventAction} />
        </>
      ) : (
        <>
          <section aria-labelledby="upcoming-heading">
            <h2 id="upcoming-heading">{t('dashboard.upcoming')}</h2>
            {upcoming.length === 0 ? (
              <p>{t('dashboard.noUpcoming')}</p>
            ) : (
              <ul>{upcoming.map(renderItem)}</ul>
            )}
          </section>
          <section aria-labelledby="past-heading">
            <h2 id="past-heading">{t('dashboard.past')}</h2>
            {past.length === 0 ? <p>{t('dashboard.noPast')}</p> : <ul>{past.map(renderItem)}</ul>}
          </section>
        </>
      )}
    </main>
  );
}
