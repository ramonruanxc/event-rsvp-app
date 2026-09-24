import type { PrismaClient } from '@prisma/client';
import type { RsvpRecord } from '@/domain/types';
import type { NewRsvp, RsvpChanges, RsvpRepository } from '@/repositories/interfaces';

/** Prisma-backed implementation of RsvpRepository. */
export class PrismaRsvpRepository implements RsvpRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /** Throws DuplicateNameError when (eventId, nameKey) already exists. */
  async create(_data: NewRsvp): Promise<RsvpRecord> {
    throw new Error('not implemented');
  }

  /** Throws DuplicateNameError when the new nameKey collides. */
  async update(_id: string, _changes: RsvpChanges): Promise<RsvpRecord> {
    throw new Error('not implemented');
  }

  /** Deletes the RSVP with the given id. */
  async delete(): Promise<void> {
    throw new Error('not implemented');
  }

  /** Returns the RSVP with the given id, or null when none exists. */
  async findById(): Promise<RsvpRecord | null> {
    throw new Error('not implemented');
  }

  /** Returns the RSVP with the given event id and name key, or null when none exists. */
  async findByNameKey(): Promise<RsvpRecord | null> {
    throw new Error('not implemented');
  }

  /** Returns the RSVP with the given event id and edit token hash, or null when none exists. */
  async findByTokenHash(): Promise<RsvpRecord | null> {
    throw new Error('not implemented');
  }

  /** Ordered by createdAt ascending. */
  async listByEvent(): Promise<RsvpRecord[]> {
    throw new Error('not implemented');
  }

  /** Stores every given RSVP. */
  async createMany(): Promise<void> {
    throw new Error('not implemented');
  }
}
