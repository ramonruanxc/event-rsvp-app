import type { EventRecord, Clock } from '@/domain/types';
import type { EventRepository } from '@/repositories/interfaces';

/** Creates a new event owned by the given user (REQ-14). */
export class CreateEventService {
  constructor(
    private readonly deps: { events: EventRepository; now: Clock; newSlug?: () => string },
  ) {}

  /** Validates values, converts the local start to UTC, and stores the event. */
  async execute(input: { ownerId: string; values: unknown }): Promise<EventRecord> {
    void input;
    throw new Error('not implemented');
  }
}
