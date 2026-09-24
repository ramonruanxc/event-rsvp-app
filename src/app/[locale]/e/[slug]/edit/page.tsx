import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { EventForm } from '@/components/event-form';
import { NotFoundError } from '@/domain/errors';
import { toLocalParts } from '@/domain/event-time';
import { getServices } from '@/lib/container';
import { requireUserId } from '@/lib/session';
import { updateEventAction } from '../actions';

/** The owner's edit form for an event, prefilled with its current values (REQ-17). */
export default async function EditEventPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const userId = await requireUserId(`/${locale}/e/${slug}/edit`);
  const t = await getTranslations();

  let view;
  try {
    view = await getServices().getEventPage.execute({ slug, userId, editToken: null });
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
  if (view.role !== 'owner') notFound();

  if (view.ended) {
    return (
      <main>
        <p>{t('event.ended')}</p>
      </main>
    );
  }

  const { event } = view;
  return (
    <main>
      <h1>{t('eventForm.titleEdit')}</h1>
      <EventForm
        initialValues={{
          name: event.name,
          description: event.description,
          location: event.location ?? '',
          timezone: event.timezone,
          ...toLocalParts(event.startsAt, event.timezone),
        }}
        submit={updateEventAction.bind(null, slug)}
      />
    </main>
  );
}
