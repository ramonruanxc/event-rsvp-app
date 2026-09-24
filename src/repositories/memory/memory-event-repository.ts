import type { EventRecord } from '@/domain/types';
import type {
  EventChanges,
  EventRepository,
  EventWithRsvpSummaries,
  NewEvent,
} from '@/repositories/interfaces';
import type { MemoryStore } from './memory-store';

/** In-memory EventRepository fake for unit tests. */
export class MemoryEventRepository implements EventRepository {
  constructor(private readonly store: MemoryStore) {}

  /** Stores a new event and returns the stored record. */
  async create(data: NewEvent): Promise<EventRecord> {
    const now = new Date();
    const record: EventRecord = {
      id: crypto.randomUUID(),
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    this.store.events.push(record);
    return { ...record };
  }

  /** Returns the event with the given slug, or null when none exists. */
  async findBySlug(slug: string): Promise<EventRecord | null> {
    const found = this.store.events.find((event) => event.slug === slug);
    return found ? { ...found } : null;
  }

  /** Applies the given changes to the event and returns the updated record. */
  async update(id: string, changes: EventChanges): Promise<EventRecord> {
    const record = this.store.events.find((event) => event.id === id);
    if (!record) throw new Error('not found');
    Object.assign(record, changes, { updatedAt: new Date() });
    return { ...record };
  }

  /** Deletes the event; its RSVPs are removed with it. */
  async delete(id: string): Promise<void> {
    const index = this.store.events.findIndex((event) => event.id === id);
    if (index === -1) throw new Error('not found');
    this.store.events.splice(index, 1);
    this.store.rsvps = this.store.rsvps.filter((rsvp) => rsvp.eventId !== id);
  }

  /** Returns every event owned by ownerId, each paired with its RSVPs' status and partySize. */
  async listByOwnerWithRsvpSummaries(ownerId: string): Promise<EventWithRsvpSummaries[]> {
    return this.store.events
      .filter((event) => event.ownerId === ownerId)
      .map((event) => ({
        event: { ...event },
        rsvps: this.store.rsvps
          .filter((rsvp) => rsvp.eventId === event.id)
          .map(({ status, partySize }) => ({ status, partySize })),
      }));
  }
}
