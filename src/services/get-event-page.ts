import { NotFoundError } from '@/domain/errors';
import { hasEnded, isOwner } from '@/domain/policies';
import { computeTotals } from '@/domain/rsvp';
import type { EventRecord, OwnerRsvpRow, OwnRsvp, Clock, Totals } from '@/domain/types';
import { hashToken } from '@/lib/crypto';
import type { EventRepository, RsvpRepository } from '@/repositories/interfaces';

/** The event page's data, shaped differently for the owner and for a guest (REQ-33). */
export type EventPageView =
  | { role: 'owner'; event: EventRecord; ended: boolean; totals: Totals; rsvps: OwnerRsvpRow[] }
  | { role: 'guest'; event: EventRecord; ended: boolean; totals: Totals; ownRsvp: OwnRsvp | null };

/** Loads an event page's data, scoped to the viewer's role (REQ-33). */
export class GetEventPageService {
  constructor(
    private readonly deps: { events: EventRepository; rsvps: RsvpRepository; now: Clock },
  ) {}

  /** Returns the owner view (full guest list) or the guest view (totals + own RSVP only). */
  async execute(input: {
    slug: string;
    userId: string | null;
    editToken: string | null;
  }): Promise<EventPageView> {
    const event = await this.deps.events.findBySlug(input.slug);
    if (!event) throw new NotFoundError();
    const now = this.deps.now();
    const ended = hasEnded(event, now);
    const allRsvps = await this.deps.rsvps.listByEvent(event.id);
    const totals = computeTotals(allRsvps);

    if (isOwner(event, input.userId)) {
      const rsvps: OwnerRsvpRow[] = allRsvps.map(({ id, name, status, partySize, updatedAt }) => ({
        id,
        name,
        status,
        partySize,
        updatedAt,
      }));
      return { role: 'owner', event, ended, totals, rsvps };
    }

    const own = input.editToken
      ? await this.deps.rsvps.findByTokenHash(event.id, hashToken(input.editToken))
      : null;
    const ownRsvp: OwnRsvp | null = own
      ? { name: own.name, status: own.status, partySize: own.partySize }
      : null;
    return { role: 'guest', event, ended, totals, ownRsvp };
  }
}
