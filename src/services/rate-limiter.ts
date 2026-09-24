import type { Clock } from '@/domain/types';
import type { RateLimitRepository } from '@/repositories/interfaces';

/** A named quota: at most `limit` calls per subject within `windowMs`. */
export interface RateLimitRule {
  name: 'rsvp' | 'ai';
  limit: number;
  windowMs: number;
}

/** REQ-56: at most 10 RSVP submissions per hashed IP per 10-minute window. */
export const RSVP_RULE: RateLimitRule = { name: 'rsvp', limit: 10, windowMs: 600_000 };
/** REQ-48: at most 20 "Fill with AI" calls per user per UTC day. */
export const AI_RULE: RateLimitRule = { name: 'ai', limit: 20, windowMs: 86_400_000 };

/** Aligns `now` to the start of its fixed window of size `windowMs`. */
export function windowStart(now: Date, windowMs: number): Date {
  return new Date(Math.floor(now.getTime() / windowMs) * windowMs);
}

/** Fixed-window rate limiter backed by a RateLimitRepository counter. */
export class RateLimiter {
  constructor(private readonly deps: { repo: RateLimitRepository; now: Clock }) {}

  /** Increments the counter for (rule, subject) in the current window and reports whether it is still allowed. */
  async consume(
    rule: RateLimitRule,
    subject: string,
  ): Promise<{ allowed: boolean; count: number }> {
    const count = await this.deps.repo.increment(
      `${rule.name}:${subject}`,
      windowStart(this.deps.now(), rule.windowMs),
    );
    return { allowed: count <= rule.limit, count };
  }
}
