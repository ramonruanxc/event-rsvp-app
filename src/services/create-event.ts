import { ValidationError } from '@/domain/errors';
import { assertNotInPast } from '@/domain/policies';
import { eventInputSchema } from '@/domain/schemas';
import { generateSlug } from '@/domain/slug';
import { toStartsAt } from '@/domain/event-time';
import type { EventRecord, Clock } from '@/domain/types';
import type { EventRepository } from '@/repositories/interfaces';

/** Creates a new event owned by the given user (REQ-14). */
export class CreateEventService {
  constructor(
    private readonly deps: { events: EventRepository; now: Clock; newSlug?: () => string },
  ) {}

  /** Validates values, converts the local start to UTC, and stores the event. */
  async execute(input: { ownerId: string; values: unknown }): Promise<EventRecord> {
    const parsed = eventInputSchema.safeParse(input.values);
    if (!parsed.success) throw ValidationError.fromZod(parsed.error);

    const { name, description, date, time, timezone, location } = parsed.data;
    const startsAt = toStartsAt(date, time, timezone);
    assertNotInPast(startsAt, this.deps.now());

    return this.deps.events.create({
      slug: (this.deps.newSlug ?? generateSlug)(),
      ownerId: input.ownerId,
      name,
      description,
      location,
      startsAt,
      timezone,
    });
  }
}
