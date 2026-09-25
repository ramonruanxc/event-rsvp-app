import type { PrismaClient } from '@prisma/client';
import type { RateLimitRepository } from '@/repositories/interfaces';

/** Postgres-backed RateLimitRepository using an atomic upsert for the counter. */
export class PrismaRateLimitRepository implements RateLimitRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /** Atomically increments the counter of (key, windowStart) and returns the new count (first call → 1). */
  async increment(key: string, windowStart: Date): Promise<number> {
    const rows = await this.prisma.$queryRaw<{ count: number }[]>`
      INSERT INTO "RateLimit" ("key", "windowStart", "count") VALUES (${key}, ${windowStart}, 1)
      ON CONFLICT ("key", "windowStart") DO UPDATE SET "count" = "RateLimit"."count" + 1
      RETURNING "count"`;
    return Number(rows[0].count);
  }
}
