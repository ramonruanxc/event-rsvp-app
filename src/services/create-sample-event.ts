import { ValidationError } from '@/domain/errors';
import { addDaysToDateString, toLocalParts, toStartsAt } from '@/domain/event-time';
import { toNameKey } from '@/domain/name-key';
import { timezoneSchema } from '@/domain/schemas';
import { SAMPLE_GUESTS } from '@/domain/sample';
import { generateSlug } from '@/domain/slug';
import type { EventRecord, Clock } from '@/domain/types';
import { generateEditToken, hashToken } from '@/lib/crypto';
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
  async execute(input: {
    ownerId: string;
    timezone: string;
    content: SampleContent;
  }): Promise<EventRecord> {
    const parsedTimezone = timezoneSchema.safeParse(input.timezone);
    if (!parsedTimezone.success) throw new ValidationError({ timezone: 'invalidTimezone' });
    const timezone = parsedTimezone.data;

    const today = toLocalParts(this.deps.now(), timezone).date;
    const startsAt = toStartsAt(addDaysToDateString(today, 7), '19:00', timezone);

    const event = await this.deps.events.create({
      slug: (this.deps.newSlug ?? generateSlug)(),
      ownerId: input.ownerId,
      name: input.content.name,
      description: input.content.description,
      location: input.content.location,
      startsAt,
      timezone,
    });

    await this.deps.rsvps.createMany(
      SAMPLE_GUESTS.map((guest) => ({
        eventId: event.id,
        name: guest.name,
        nameKey: toNameKey(guest.name),
        status: guest.status,
        partySize: guest.partySize,
        editTokenHash: hashToken(generateEditToken()),
      })),
    );

    return event;
  }
}
