import { NotFoundError } from '@/domain/errors';
import { assertOwner } from '@/domain/policies';
import type { EventRepository } from '@/repositories/interfaces';

/** Deletes an event and its RSVPs; only its owner may delete it, even after it has ended (REQ-18). */
export class DeleteEventService {
  constructor(private readonly deps: { events: EventRepository }) {}

  /** Checks ownership then deletes the event (RSVPs are removed by cascade). */
  async execute(input: { userId: string | null; slug: string }): Promise<void> {
    const event = await this.deps.events.findBySlug(input.slug);
    if (!event) throw new NotFoundError();
    assertOwner(event, input.userId);
    await this.deps.events.delete(event.id);
  }
}
