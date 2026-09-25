import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { CopyInviteLinkButton } from '@/components/copy-invite-link-button';
import { DeleteEventButton } from '@/components/delete-event-button';
import { EventDetails } from '@/components/event-details';
import { GuestRsvpPanel } from '@/components/guest-rsvp-panel';
import { OwnerGuestList } from '@/components/owner-guest-list';
import { NotFoundError } from '@/domain/errors';
import { Link } from '@/i18n/navigation';
import { getServices } from '@/lib/container';
import { editTokenCookieName } from '@/lib/edit-token-cookie';
import { getCurrentUserId } from '@/lib/session';
import { cancelRsvpAction, deleteEventAction, submitRsvpAction } from './actions';

/** An event's public page: RSVP form for guests, full guest list for the owner (REQ-33). */
export default async function EventPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const userId = await getCurrentUserId();
  const t = await getTranslations();
  const store = await cookies();
  const editToken = store.get(editTokenCookieName(locale))?.value ?? null;

  let view;
  try {
    view = await getServices().getEventPage.execute({ slug, userId, editToken });
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
      {view.role === 'owner' && <CopyInviteLinkButton slug={slug} />}
      {view.role === 'owner' && <OwnerGuestList view={view} locale={locale} />}
      {view.role === 'guest' && (
        <GuestRsvpPanel
          ownRsvp={view.ownRsvp}
          ended={view.ended}
          submit={submitRsvpAction.bind(null, locale, slug)}
          cancel={cancelRsvpAction.bind(null, locale, slug)}
        />
      )}
    </main>
  );
}
