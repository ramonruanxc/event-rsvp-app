import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { Pencil } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { buttonClass } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
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
    <main className="page">
      <div className="col-640">
        <EventDetails event={view.event} totals={view.totals} locale={locale} ended={view.ended} />
        {view.role === 'owner' && (
          <div className="owner-tools mt-6">
            <CopyInviteLinkButton slug={slug} />
            <div className="owner-actions">
              {!view.ended && (
                <Link className={buttonClass('secondary')} href={`/e/${slug}/edit`}>
                  <Icon icon={Pencil} />
                  {t('event.edit')}
                </Link>
              )}
              <DeleteEventButton deleteAction={deleteEventAction.bind(null, slug)} />
            </div>
          </div>
        )}
        <hr className="divider" />
        {view.role === 'owner' && <OwnerGuestList view={view} locale={locale} />}
        {view.role === 'guest' && (
          <GuestRsvpPanel
            ownRsvp={view.ownRsvp}
            ended={view.ended}
            submit={submitRsvpAction.bind(null, locale, slug)}
            cancel={cancelRsvpAction.bind(null, locale, slug)}
          />
        )}
      </div>
    </main>
  );
}
