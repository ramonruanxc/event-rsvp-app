import type { Clock } from '@/domain/types';
import type { EventTextParser, ParseEventResult } from '@/lib/ai/types';
import type { RateLimiter } from './rate-limiter';

/** Parses organizer-written event text through the AI, enforcing the daily per-user limit (REQ-48). */
export class ParseEventTextService {
  constructor(
    private readonly deps: { parser: EventTextParser; rateLimiter: RateLimiter; now: Clock },
  ) {}

  /** Validates the text, consumes the AI quota, then delegates to the parser. */
  async execute(_input: {
    userId: string;
    text: string;
    timezone: string | null;
  }): Promise<ParseEventResult> {
    throw new Error('not implemented');
  }
}
