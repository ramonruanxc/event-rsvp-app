import { Clock } from 'lucide-react';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { EventForm } from '@/components/event-form';
import { NotFoundError } from '@/domain/errors';
import { toLocalParts } from '@/domain/event-time';
import { getServices } from '@/lib/container';
import { requireUserId } from '@/lib/session';
import { Icon } from '@/components/ui/icon';
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
      <main className="page">
        <div className="col-640">
          <div className="notice">
            <Icon icon={Clock} size={20} />
            <div>
              <h1 className="h3">{t('event.ended')}</h1>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const { event } = view;
  return (
    <main className="page">
      <div className="col-640">
        <div className="page-head">
          <h1 className="h2">{t('eventForm.titleEdit')}</h1>
        </div>
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
      </div>
    </main>
  );
}
