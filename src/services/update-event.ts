import { NotFoundError, ValidationError } from '@/domain/errors';
import { toStartsAt } from '@/domain/event-time';
import { assertNotEnded, assertNotInPast, assertOwner } from '@/domain/policies';
import { eventInputSchema } from '@/domain/schemas';
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
    const event = await this.deps.events.findBySlug(input.slug);
    if (!event) throw new NotFoundError();
    assertOwner(event, input.userId);
    const now = this.deps.now();
    assertNotEnded(event, now);

    const parsed = eventInputSchema.safeParse(input.values);
    if (!parsed.success) throw ValidationError.fromZod(parsed.error);

    const { name, description, date, time, timezone, location } = parsed.data;
    const startsAt = toStartsAt(date, time, timezone);
    assertNotInPast(startsAt, now);

    return this.deps.events.update(event.id, {
      name,
      description,
      location,
      startsAt,
      timezone,
    });
  }
}
