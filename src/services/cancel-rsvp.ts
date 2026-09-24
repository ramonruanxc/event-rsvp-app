import type { Clock, OwnRsvp } from '@/domain/types';
import type { EventRepository, RsvpRepository } from '@/repositories/interfaces';

/** Sets a guest's own RSVP to Not going, keeping it on the list (REQ-28, REQ-29). */
export class CancelRsvpService {
  constructor(
    private readonly deps: { events: EventRepository; rsvps: RsvpRepository; now: Clock },
  ) {}

  /** Finds the event and the guest's own RSVP by edit token, then cancels it. */
  async execute(_input: { slug: string; editToken: string | null }): Promise<OwnRsvp> {
    throw new Error('not implemented');
  }
}
