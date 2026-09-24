import { notFound } from 'next/navigation';
import { EventDetails } from '@/components/event-details';
import { NotFoundError } from '@/domain/errors';
import { getServices } from '@/lib/container';
import { getCurrentUserId } from '@/lib/session';

/** An event's public page: details for guests, full guest list for the owner (REQ-33). */
export default async function EventPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const userId = await getCurrentUserId();

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
    </main>
  );
}
