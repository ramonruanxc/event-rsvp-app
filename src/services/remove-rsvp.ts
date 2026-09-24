import { NotFoundError } from '@/domain/errors';
import { assertOwner } from '@/domain/policies';
import type { EventRepository, RsvpRepository } from '@/repositories/interfaces';

/** Deletes an RSVP; only the event's owner may remove it, even after it has ended (REQ-30). */
export class RemoveRsvpService {
  constructor(private readonly deps: { events: EventRepository; rsvps: RsvpRepository }) {}

  /** Checks ownership and that the RSVP belongs to the event, then deletes it. */
  async execute(input: { userId: string | null; slug: string; rsvpId: string }): Promise<void> {
    const event = await this.deps.events.findBySlug(input.slug);
    if (!event) throw new NotFoundError();
    assertOwner(event, input.userId);

    const rsvp = await this.deps.rsvps.findById(input.rsvpId);
    if (!rsvp || rsvp.eventId !== event.id) throw new NotFoundError();

    await this.deps.rsvps.delete(rsvp.id);
  }
}
