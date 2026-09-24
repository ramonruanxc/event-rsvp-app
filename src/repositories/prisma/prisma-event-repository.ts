import type { PrismaClient } from '@prisma/client';
import type { EventRecord } from '@/domain/types';
import type { EventRepository, EventWithRsvpSummaries, NewEvent } from '@/repositories/interfaces';

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
  async update(): Promise<EventRecord> {
    throw new Error('not implemented');
  }

  /** Deletes the event; its RSVPs are removed by cascade. */
  async delete(): Promise<void> {
    throw new Error('not implemented');
  }

  /** Returns every event owned by ownerId, each paired with its RSVPs' status and partySize. */
  async listByOwnerWithRsvpSummaries(): Promise<EventWithRsvpSummaries[]> {
    throw new Error('not implemented');
  }
}
