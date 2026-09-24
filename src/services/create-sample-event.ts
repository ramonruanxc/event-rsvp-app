import type { EventRecord, Clock } from '@/domain/types';
import type { EventRepository, RsvpRepository } from '@/repositories/interfaces';

/** Text fields of the sample event, sourced from translations. */
export interface SampleContent {
  name: string;
  description: string;
  location: string;
}

/** Creates a sample event, 7 days ahead at 19:00 local time, with 5 fictional RSVPs (REQ-37, BR-49, BR-50). */
export class CreateSampleEventService {
  constructor(
    private readonly deps: {
      events: EventRepository;
      rsvps: RsvpRepository;
      now: Clock;
      newSlug?: () => string;
    },
  ) {}

  /** Validates the organizer's timezone, then creates the event and its sample RSVPs. */
  async execute(_input: {
    ownerId: string;
    timezone: string;
    content: SampleContent;
  }): Promise<EventRecord> {
    throw new Error('not implemented');
  }
}
