import type { Clock } from '@/domain/types';
import type { EventRepository } from '@/repositories/interfaces';

/** Builds the downloadable .ics file for an event (REQ-42). */
export class ExportEventIcsService {
  constructor(private readonly deps: { events: EventRepository; now: Clock }) {}

  /** Returns the file name and calendar body for the event, or throws NotFoundError. */
  async execute(_input: { slug: string }): Promise<{ filename: string; body: string }> {
    throw new Error('not implemented');
  }
}
