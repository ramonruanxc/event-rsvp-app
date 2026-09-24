import type { EventRecord, OwnerRsvpRow, OwnRsvp, Clock, Totals } from '@/domain/types';
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
    void input;
    throw new Error('not implemented');
  }
}
