import { NotFoundError } from '@/domain/errors';
import { assertNotEnded } from '@/domain/policies';
import type { Clock, OwnRsvp } from '@/domain/types';
import { hashToken } from '@/lib/crypto';
import type { EventRepository, RsvpRepository } from '@/repositories/interfaces';

/** Sets a guest's own RSVP to Not going, keeping it on the list (REQ-28, REQ-29). */
export class CancelRsvpService {
  constructor(
    private readonly deps: { events: EventRepository; rsvps: RsvpRepository; now: Clock },
  ) {}

  /** Finds the event and the guest's own RSVP by edit token, then cancels it. */
  async execute(input: { slug: string; editToken: string | null }): Promise<OwnRsvp> {
    const event = await this.deps.events.findBySlug(input.slug);
    if (!event) throw new NotFoundError();

    assertNotEnded(event, this.deps.now());

    const own = input.editToken
      ? await this.deps.rsvps.findByTokenHash(event.id, hashToken(input.editToken))
      : null;
    if (!own) throw new NotFoundError();

    const updated = await this.deps.rsvps.update(own.id, { status: 'NOT_GOING', partySize: 0 });
    return { name: updated.name, status: updated.status, partySize: updated.partySize };
  }
}
