import { DuplicateNameError } from '@/domain/errors';
import type { RsvpRecord } from '@/domain/types';
import type { NewRsvp, RsvpChanges, RsvpRepository } from '@/repositories/interfaces';
import type { MemoryStore } from './memory-store';

/** In-memory RsvpRepository fake for unit tests. */
export class MemoryRsvpRepository implements RsvpRepository {
  constructor(private readonly store: MemoryStore) {}

  /** Throws DuplicateNameError when (eventId, nameKey) already exists. */
  async create(data: NewRsvp): Promise<RsvpRecord> {
    if (
      this.store.rsvps.some(
        (rsvp) => rsvp.eventId === data.eventId && rsvp.nameKey === data.nameKey,
      )
    ) {
      throw new DuplicateNameError();
    }
    const now = new Date();
    const record: RsvpRecord = { id: crypto.randomUUID(), ...data, createdAt: now, updatedAt: now };
    this.store.rsvps.push(record);
    return { ...record };
  }

  /** Throws DuplicateNameError when the new nameKey collides. */
  async update(id: string, changes: RsvpChanges): Promise<RsvpRecord> {
    const record = this.store.rsvps.find((rsvp) => rsvp.id === id);
    if (!record) throw new Error('not found');
    if (
      changes.nameKey !== undefined &&
      this.store.rsvps.some(
        (rsvp) =>
          rsvp.id !== id && rsvp.eventId === record.eventId && rsvp.nameKey === changes.nameKey,
      )
    ) {
      throw new DuplicateNameError();
    }
    Object.assign(record, changes, { updatedAt: new Date() });
    return { ...record };
  }

  /** Deletes the RSVP with the given id. */
  async delete(id: string): Promise<void> {
    const index = this.store.rsvps.findIndex((rsvp) => rsvp.id === id);
    if (index === -1) throw new Error('not found');
    this.store.rsvps.splice(index, 1);
  }

  /** Returns the RSVP with the given id, or null when none exists. */
  async findById(id: string): Promise<RsvpRecord | null> {
    const found = this.store.rsvps.find((rsvp) => rsvp.id === id);
    return found ? { ...found } : null;
  }

  /** Returns the RSVP with the given event id and name key, or null when none exists. */
  async findByNameKey(eventId: string, nameKey: string): Promise<RsvpRecord | null> {
    const found = this.store.rsvps.find(
      (rsvp) => rsvp.eventId === eventId && rsvp.nameKey === nameKey,
    );
    return found ? { ...found } : null;
  }

  /** Returns the RSVP with the given event id and edit token hash, or null when none exists. */
  async findByTokenHash(eventId: string, editTokenHash: string): Promise<RsvpRecord | null> {
    const found = this.store.rsvps.find(
      (rsvp) => rsvp.eventId === eventId && rsvp.editTokenHash === editTokenHash,
    );
    return found ? { ...found } : null;
  }

  /** Ordered by createdAt ascending. */
  async listByEvent(eventId: string): Promise<RsvpRecord[]> {
    return this.store.rsvps
      .filter((rsvp) => rsvp.eventId === eventId)
      .map((rsvp) => ({ ...rsvp }))
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  /** Stores every given RSVP. */
  async createMany(data: NewRsvp[]): Promise<void> {
    for (const item of data) {
      await this.create(item);
    }
  }
}
