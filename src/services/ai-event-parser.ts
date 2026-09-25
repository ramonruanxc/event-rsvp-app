import { AiNotConfiguredError, AiTimeoutError, AiUnavailableError } from '@/domain/errors';
import { ProviderUnavailableError } from '@/lib/ai/errors';
import { normalizeAiOutput } from '@/lib/ai/output';
import { buildUserMessage, SYSTEM_PROMPT } from '@/lib/ai/prompt';
import { AI_TIMEOUT_MS, MIN_ATTEMPT_MS } from '@/lib/ai/types';
import type { AiProvider, EventTextParser, ParseEventResult } from '@/lib/ai/types';
import { TimeoutError, withTimeout } from '@/lib/with-timeout';

/** True when an attempt ran out of time: the budget timer, a client abort or HTTP 408 (REQ-132). */
function isTimeout(error: unknown): boolean {
  return (
    error instanceof TimeoutError ||
    (error instanceof ProviderUnavailableError && error.reason === 'timeout')
  );
}

/** Parses organizer text into event fields using the configured providers, with a hard timeout (REQ-45, REQ-47). */
export class AiEventParser implements EventTextParser {
  constructor(private readonly deps: { providers: readonly AiProvider[]; clock?: () => number }) {}

  /**
   * Tries the providers in order within AI_TIMEOUT_MS and normalizes the first answer. When none answers
   * (REQ-132): no provider → AiNotConfiguredError; budget spent or last attempt timed out → AiTimeoutError;
   * anything else → AiUnavailableError.
   */
  async parse(request: {
    text: string;
    formTimezone: string | null;
    now: Date;
  }): Promise<ParseEventResult> {
    const { text, formTimezone, now } = request;
    if (this.deps.providers.length === 0) throw new AiNotConfiguredError(); // no key configured (BR-137)
    const user = buildUserMessage({ text, now, timezone: formTimezone });
    const clock = this.deps.clock ?? (() => Date.now());
    const deadline = clock() + AI_TIMEOUT_MS;
    let lastAttemptTimedOut = false;

    for (const provider of this.deps.providers) {
      const remaining = deadline - clock();
      if (remaining < MIN_ATTEMPT_MS) throw new AiTimeoutError(); // the budget ran out first (BR-121, BR-172)
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
        if (error instanceof ProviderUnavailableError || error instanceof TimeoutError) {
          lastAttemptTimedOut = isTimeout(error); // outage: try the next provider (BR-121)
          continue;
        }
        throw new AiUnavailableError(); // anything else is never retried (BR-122)
      }
      return normalizeAiOutput(raw, formTimezone); // schema failure → AiUnavailableError, no retry (BR-122)
    }
    throw lastAttemptTimedOut ? new AiTimeoutError() : new AiUnavailableError(); // the last attempt decides
  }
}
