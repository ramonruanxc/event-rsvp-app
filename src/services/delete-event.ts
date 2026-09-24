import type { EventRepository } from '@/repositories/interfaces';

/** Deletes an event and its RSVPs; only its owner may delete it, even after it has ended (REQ-18). */
export class DeleteEventService {
  constructor(private readonly deps: { events: EventRepository }) {}

  /** Checks ownership then deletes the event (RSVPs are removed by cascade). */
  async execute(input: { userId: string | null; slug: string }): Promise<void> {
    void input;
    throw new Error('not implemented');
  }
}
