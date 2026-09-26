import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { EventForm } from '@/components/event-form';
import { isAiConfigured } from '@/lib/ai/providers-config';
import { requireUserId } from '@/lib/session';
import { createEventAction } from './actions';
import { parseEventTextAction } from './ai-actions';

// AI budget is 20s (AI_TIMEOUT_MS) plus margin; server actions invoked from this page (the AI fill)
// run inside its function, and 30s is within every Vercel plan's configurable maximum (REQ-133).
export const maxDuration = 30;

/** Localized page title (REQ-134). */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return { title: t('eventForm.titleNew') };
}

/** Form to create a new event; only reachable by a signed-in user (REQ-15). */
export default async function NewEventPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  await requireUserId(`/${locale}/events/new`);
  const t = await getTranslations();
  const aiConfigured = isAiConfigured(process.env); // REQ-156: known before the organizer types
  return (
    <main className="page">
      <div className="col-640">
        <div className="page-head">
          <h1 className="h2">{t('eventForm.titleNew')}</h1>
        </div>
        <EventForm
          submit={createEventAction}
          aiFill={aiConfigured ? parseEventTextAction : undefined}
          aiNotConfigured={!aiConfigured}
        />
      </div>
    </main>
  );
}
