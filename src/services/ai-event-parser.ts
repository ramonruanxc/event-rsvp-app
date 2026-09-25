import { AiUnavailableError } from '@/domain/errors';
import { ProviderUnavailableError } from '@/lib/ai/errors';
import { normalizeAiOutput } from '@/lib/ai/output';
import { buildUserMessage, SYSTEM_PROMPT } from '@/lib/ai/prompt';
import { AI_TIMEOUT_MS, MIN_ATTEMPT_MS } from '@/lib/ai/types';
import type { AiProvider, EventTextParser, ParseEventResult } from '@/lib/ai/types';
import { TimeoutError, withTimeout } from '@/lib/with-timeout';

/** Parses organizer text into event fields using the configured providers, with a hard timeout (REQ-45, REQ-47). */
export class AiEventParser implements EventTextParser {
  constructor(private readonly deps: { providers: readonly AiProvider[]; clock?: () => number }) {}

  /** Sends the prompt to the model within AI_TIMEOUT_MS and normalizes its raw output. */
  async parse(request: {
    text: string;
    formTimezone: string | null;
    now: Date;
  }): Promise<ParseEventResult> {
    const { text, formTimezone, now } = request;
    const user = buildUserMessage({ text, now, timezone: formTimezone });
    const clock = this.deps.clock ?? (() => Date.now());
    const deadline = clock() + AI_TIMEOUT_MS;

    for (const provider of this.deps.providers) {
      const remaining = deadline - clock();
      if (remaining < MIN_ATTEMPT_MS) break; // the retry would not fit in the budget (BR-121)
      let raw: unknown;
      try {
        raw = await withTimeout(
          provider.client.complete({
            system: SYSTEM_PROMPT,
            user,
            model: provider.model,
            timeoutMs: remaining,
          }),
          remaining,
        );
      } catch (error) {
        if (error instanceof ProviderUnavailableError || error instanceof TimeoutError) continue; // outage (BR-121)
        throw new AiUnavailableError(); // anything else is never retried (BR-122)
      }
      return normalizeAiOutput(raw, formTimezone); // schema failure → AiUnavailableError, no retry (BR-122)
    }
    throw new AiUnavailableError();
  }
}
