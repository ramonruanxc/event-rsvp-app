import { AiLimitReachedError, ValidationError } from '@/domain/errors';
import type { Clock } from '@/domain/types';
import { AI_RULE } from './rate-limiter';
import type { EventTextParser, ParseEventResult } from '@/lib/ai/types';
import type { RateLimiter } from './rate-limiter';

/** Parses organizer-written event text through the AI, enforcing the daily per-user limit (REQ-48). */
export class ParseEventTextService {
  constructor(
    private readonly deps: { parser: EventTextParser; rateLimiter: RateLimiter; now: Clock },
  ) {}

  /** Validates the text, consumes the AI quota, then delegates to the parser. */
  async execute(input: {
    userId: string;
    text: string;
    timezone: string | null;
  }): Promise<ParseEventResult> {
    const text = input.text.trim();
    if (text.length === 0) throw new ValidationError({ text: 'required' });
    if (text.length > 2000) throw new ValidationError({ text: 'tooLong' });

    const { allowed } = await this.deps.rateLimiter.consume(AI_RULE, input.userId);
    if (!allowed) throw new AiLimitReachedError();

    return this.deps.parser.parse({
      text,
      formTimezone: input.timezone || null,
      now: this.deps.now(),
    });
  }
}
