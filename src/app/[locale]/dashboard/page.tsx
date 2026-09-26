import { CalendarPlus, Check, ChevronRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { CreateSampleButton } from '@/components/create-sample-button';
import { Link } from '@/i18n/navigation';
import { getServices } from '@/lib/container';
import { requireUserId } from '@/lib/session';
import { dateTileParts, formatEventDateTime } from '@/lib/format-date';
import type { DashboardItem } from '@/services/list-dashboard';
import { buttonClass } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { createSampleEventAction } from './actions';

/** Ordered (title, text) message keys for the empty dashboard's three-step explanation (REQ-82). */
const STEPS = [
  ['dashboard.step1Title', 'dashboard.step1Text'],
  ['dashboard.step2Title', 'dashboard.step2Text'],
  ['dashboard.step3Title', 'dashboard.step3Text'],
] as const;

/** Localized page title (REQ-134). */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return { title: t('dashboard.title') };
}

/** The signed-in organizer's events, split into upcoming and past, with RSVP totals (REQ-36, REQ-82). */
export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const ownerId = await requireUserId(`/${locale}/dashboard`);
  const t = await getTranslations();
  const { upcoming, past } = await getServices().listDashboard.execute({ ownerId });
  const isEmpty = upcoming.length === 0 && past.length === 0;

  function renderItem(item: DashboardItem) {
    const tile = dateTileParts(item.startsAt, item.timezone, locale);
    const hasReplies = item.totals.going + item.totals.declined > 0;
    return (
      <li key={item.slug}>
        <Link className="ev-link" href={`/e/${item.slug}`}>
          <span className="date-tile" aria-hidden="true">
            <span className="m">{tile.month}</span>
            <span className="d">{tile.day}</span>
            <span className="w">{tile.weekday}</span>
          </span>
          <span className="ev-main">
            <span className="ev-name">{item.name}</span>
            <br />
            <span className="small ev-meta">
              {formatEventDateTime(item.startsAt, item.timezone, locale)}
            </span>
          </span>
          <span className="small ev-counts">
            {hasReplies ? (
              <>
                <Icon icon={Check} size={12} />
                <span>
                  {t('totals.summary', {
                    going: item.totals.going,
                    declined: item.totals.declined,
                    people: item.totals.people,
                  })}
                </span>
              </>
            ) : (
              <span>{t('dashboard.noReplies')}</span>
            )}
          </span>
          <Icon icon={ChevronRight} className="ev-chev" />
        </Link>
      </li>
    );
  }

  return (
    <main className="page">
      <div className="col-880">
        <div className="page-head">
          <h1 className="h2">{t('dashboard.title')}</h1>
          {!isEmpty && (
            <Link className={buttonClass('primary')} href="/events/new">
              <Icon icon={CalendarPlus} />
              {t('dashboard.createEvent')}
            </Link>
          )}
        </div>
        {isEmpty ? (
          <div className="panel empty">
            <div>
              <h2 className="h3">{t('dashboard.empty')}</h2>
              <p className="muted">{t('dashboard.stepsIntro')}</p>
            </div>
            <ol className="steps">
              {STEPS.map(([title, text], index) => (
                <li key={title}>
                  <span className="step-n" aria-hidden="true">
                    {index + 1}
                  </span>
                  <div>
                    <p className="t">{t(title)}</p>
                    <p className="small muted">{t(text)}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div>
              <div className="btn-row">
                <Link className={buttonClass('primary')} href="/events/new">
                  <Icon icon={CalendarPlus} />
                  {t('dashboard.createEvent')}
                </Link>
                <CreateSampleButton create={createSampleEventAction} />
              </div>
              <p className="small muted mt-2">{t('dashboard.sampleHint')}</p>
            </div>
          </div>
        ) : (
          <>
            <section aria-labelledby="upcoming-heading" className="mb-8">
              <h2 id="upcoming-heading" className="h3 mb-3">
                {t('dashboard.upcoming')}
              </h2>
              {upcoming.length === 0 ? (
                <p className="muted">{t('dashboard.noUpcoming')}</p>
              ) : (
                <ul className="ev-list">{upcoming.map(renderItem)}</ul>
              )}
            </section>
            <section aria-labelledby="past-heading">
              <h2 id="past-heading" className="h3 mb-3">
                {t('dashboard.past')}
              </h2>
              {past.length === 0 ? (
                <p className="muted">{t('dashboard.noPast')}</p>
              ) : (
                <ul className="ev-list">{past.map(renderItem)}</ul>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
