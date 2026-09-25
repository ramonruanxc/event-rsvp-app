import { NotFoundError } from '@/domain/errors';
import type { Clock } from '@/domain/types';
import { buildIcs } from '@/lib/ics';
import type { EventRepository } from '@/repositories/interfaces';

/** Builds the downloadable .ics file for an event (REQ-42). */
export class ExportEventIcsService {
  constructor(private readonly deps: { events: EventRepository; now: Clock }) {}

  /** Returns the file name and calendar body for the event, or throws NotFoundError. */
  async execute(input: { slug: string }): Promise<{ filename: string; body: string }> {
    const event = await this.deps.events.findBySlug(input.slug);
    if (!event) throw new NotFoundError();
    return { filename: `${event.slug}.ics`, body: buildIcs(event, this.deps.now()) };
  }
}
