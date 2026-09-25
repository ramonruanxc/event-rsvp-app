import { AiUnavailableError } from '@/domain/errors';
import { normalizeAiOutput } from '@/lib/ai/output';
import { buildUserMessage, SYSTEM_PROMPT } from '@/lib/ai/prompt';
import { AI_TIMEOUT_MS } from '@/lib/ai/types';
import type { AiProvider, EventTextParser, ParseEventResult } from '@/lib/ai/types';
import { withTimeout } from '@/lib/with-timeout';

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
    const provider = this.deps.providers[0];
    if (!provider) throw new AiUnavailableError();

    let raw: unknown;
    try {
      raw = await withTimeout(
        provider.client.complete({
          system: SYSTEM_PROMPT,
          user: buildUserMessage({ text, now, timezone: formTimezone }),
          model: provider.model,
        }),
        AI_TIMEOUT_MS,
      );
    } catch {
      throw new AiUnavailableError();
    }

    return normalizeAiOutput(raw, formTimezone);
  }
}
