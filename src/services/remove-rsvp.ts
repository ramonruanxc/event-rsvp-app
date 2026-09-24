import type { EventRepository, RsvpRepository } from '@/repositories/interfaces';

/** Deletes an RSVP; only the event's owner may remove it, even after it has ended (REQ-30). */
export class RemoveRsvpService {
  constructor(private readonly deps: { events: EventRepository; rsvps: RsvpRepository }) {}

  /** Checks ownership and that the RSVP belongs to the event, then deletes it. */
  async execute(_input: { userId: string | null; slug: string; rsvpId: string }): Promise<void> {
    throw new Error('not implemented');
  }
}
