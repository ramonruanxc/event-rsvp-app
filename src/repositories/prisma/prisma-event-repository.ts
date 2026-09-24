import type { PrismaClient } from '@prisma/client';
import type { EventRecord } from '@/domain/types';
import type {
  EventChanges,
  EventRepository,
  EventWithRsvpSummaries,
  NewEvent,
} from '@/repositories/interfaces';

/** Prisma-backed implementation of EventRepository. */
export class PrismaEventRepository implements EventRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /** Stores a new event and returns the stored record. */
  async create(data: NewEvent): Promise<EventRecord> {
    return this.prisma.event.create({ data });
  }

  /** Returns the event with the given slug, or null when none exists. */
  async findBySlug(slug: string): Promise<EventRecord | null> {
    return this.prisma.event.findUnique({ where: { slug } });
  }

  /** Applies the given changes to the event and returns the updated record. */
  async update(id: string, changes: EventChanges): Promise<EventRecord> {
    return this.prisma.event.update({ where: { id }, data: changes });
  }

  /** Deletes the event; its RSVPs are removed by cascade. */
  async delete(id: string): Promise<void> {
    await this.prisma.event.delete({ where: { id } });
  }

  /** Returns every event owned by ownerId, each paired with its RSVPs' status and partySize. */
  async listByOwnerWithRsvpSummaries(): Promise<EventWithRsvpSummaries[]> {
    throw new Error('not implemented');
  }
}
