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
  async delete(id: string): Promise<void> {
    await this.prisma.rsvp.delete({ where: { id } });
  }

  /** Returns the RSVP with the given id, or null when none exists. */
  async findById(id: string): Promise<RsvpRecord | null> {
    return this.prisma.rsvp.findUnique({ where: { id } });
  }

  /** Returns the RSVP with the given event id and name key, or null when none exists. */
  async findByNameKey(eventId: string, nameKey: string): Promise<RsvpRecord | null> {
    return this.prisma.rsvp.findFirst({ where: { eventId, nameKey } });
  }

  /** Returns the RSVP with the given event id and edit token hash, or null when none exists. */
  async findByTokenHash(eventId: string, editTokenHash: string): Promise<RsvpRecord | null> {
    return this.prisma.rsvp.findFirst({ where: { eventId, editTokenHash } });
  }

  /** Ordered by createdAt ascending. */
  async listByEvent(eventId: string): Promise<RsvpRecord[]> {
    return this.prisma.rsvp.findMany({
      where: { eventId },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
  }

  /** Stores every given RSVP. */
  async createMany(data: NewRsvp[]): Promise<void> {
    await this.prisma.rsvp.createMany({ data });
  }
}
