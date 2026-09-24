import { Prisma, type PrismaClient } from '@prisma/client';
import { DuplicateNameError } from '@/domain/errors';
import type { RsvpRecord } from '@/domain/types';
import type { NewRsvp, RsvpChanges, RsvpRepository } from '@/repositories/interfaces';

/** True when the error is a Prisma unique-constraint violation (P2002). */
function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

/** Prisma-backed implementation of RsvpRepository. */
export class PrismaRsvpRepository implements RsvpRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /** Throws DuplicateNameError when (eventId, nameKey) already exists. */
  async create(data: NewRsvp): Promise<RsvpRecord> {
    try {
      return await this.prisma.rsvp.create({ data });
    } catch (error) {
      if (isUniqueViolation(error)) throw new DuplicateNameError();
      throw error;
    }
  }

  /** Throws DuplicateNameError when the new nameKey collides. */
  async update(id: string, changes: RsvpChanges): Promise<RsvpRecord> {
    try {
      return await this.prisma.rsvp.update({ where: { id }, data: changes });
    } catch (error) {
      if (isUniqueViolation(error)) throw new DuplicateNameError();
      throw error;
    }
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
