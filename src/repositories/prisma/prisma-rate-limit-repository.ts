import type { PrismaClient } from '@prisma/client';
import type { RateLimitRepository } from '@/repositories/interfaces';

/** Postgres-backed RateLimitRepository using an atomic upsert for the counter. */
export class PrismaRateLimitRepository implements RateLimitRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /** Atomically increments the counter of (key, windowStart) and returns the new count (first call → 1). */
  async increment(_key: string, _windowStart: Date): Promise<number> {
    throw new Error('not implemented');
  }
}
