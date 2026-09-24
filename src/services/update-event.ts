import type { EventRecord, Clock } from '@/domain/types';
import type { EventRepository } from '@/repositories/interfaces';

/** Updates an existing event; only its owner may edit it, and only before it starts (REQ-16). */
export class UpdateEventService {
  constructor(private readonly deps: { events: EventRepository; now: Clock }) {}

  /** Validates values, checks ownership and that the event has not ended, then persists the changes. */
  async execute(input: {
    userId: string | null;
    slug: string;
    values: unknown;
  }): Promise<EventRecord> {
    void input;
    throw new Error('not implemented');
  }
}
