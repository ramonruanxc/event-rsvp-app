import type { Clock } from '@/domain/types';
import type { RateLimitRepository } from '@/repositories/interfaces';

/** A named quota: at most `limit` calls per subject within `windowMs`. */
export interface RateLimitRule {
  name: 'rsvp' | 'ai' | 'signin-email' | 'signin-ip';
  limit: number;
  windowMs: number;
}

/** REQ-56: at most 10 RSVP submissions per hashed IP per 10-minute window. */
export const RSVP_RULE: RateLimitRule = { name: 'rsvp', limit: 10, windowMs: 600_000 };
/** REQ-48: at most 20 "Fill with AI" calls per user per UTC day. */
export const AI_RULE: RateLimitRule = { name: 'ai', limit: 20, windowMs: 86_400_000 };
/** REQ-119: at most 5 failed sign-ins per email per 15 minutes. */
export const SIGNIN_EMAIL_RULE: RateLimitRule = {
  name: 'signin-email',
  limit: 5,
  windowMs: 900_000,
};
/** REQ-119: at most 20 failed sign-ins per client IP per 15 minutes. */
export const SIGNIN_IP_RULE: RateLimitRule = { name: 'signin-ip', limit: 20, windowMs: 900_000 };

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

  /** True when (rule, subject) already reached rule.limit in the current window; never increments. */
  async isBlocked(rule: RateLimitRule, subject: string): Promise<boolean> {
    const count = await this.deps.repo.count(
      `${rule.name}:${subject}`,
      windowStart(this.deps.now(), rule.windowMs),
    );
    return count >= rule.limit;
  }
}
