import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { DeleteEventButton } from '@/components/delete-event-button';
import { EventDetails } from '@/components/event-details';
import { NotFoundError } from '@/domain/errors';
import { Link } from '@/i18n/navigation';
import { getServices } from '@/lib/container';
import { getCurrentUserId } from '@/lib/session';
import { deleteEventAction } from './actions';

/** An event's public page: details for guests, full guest list for the owner (REQ-33). */
export default async function EventPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const userId = await getCurrentUserId();
  const t = await getTranslations();

  let view;
  try {
    view = await getServices().getEventPage.execute({ slug, userId, editToken: null });
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  return (
    <main>
      <EventDetails event={view.event} totals={view.totals} locale={locale} />
      {view.role === 'owner' && !view.ended && (
        <Link href={`/e/${slug}/edit`}>{t('event.edit')}</Link>
      )}
      {view.role === 'owner' && (
        <DeleteEventButton deleteAction={deleteEventAction.bind(null, slug)} />
      )}
    </main>
  );
}
