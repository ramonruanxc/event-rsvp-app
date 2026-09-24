import type { RateLimitRepository } from '@/repositories/interfaces';
import type { MemoryStore } from './memory-store';

/** In-memory RateLimitRepository fake for unit tests. */
export class MemoryRateLimitRepository implements RateLimitRepository {
  constructor(private readonly store: MemoryStore) {}

  /** Atomically increments the counter of (key, windowStart) and returns the new count (first call → 1). */
  async increment(key: string, windowStart: Date): Promise<number> {
    const mapKey = `${key}|${windowStart.toISOString()}`;
    const next = (this.store.rateLimits.get(mapKey) ?? 0) + 1;
    this.store.rateLimits.set(mapKey, next);
    return next;
  }
}
