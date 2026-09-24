import { getTranslations } from 'next-intl/server';
import { EventForm } from '@/components/event-form';
import { requireUserId } from '@/lib/session';
import { createEventAction } from './actions';
import { parseEventTextAction } from './ai-actions';

/** Form to create a new event; only reachable by a signed-in user (REQ-15). */
export default async function NewEventPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  await requireUserId(`/${locale}/events/new`);
  const t = await getTranslations();
  return (
    <main>
      <h1>{t('eventForm.titleNew')}</h1>
      <EventForm submit={createEventAction} aiFill={parseEventTextAction} />
    </main>
  );
}
