import type { AiModelClient, EventTextParser, ParseEventResult } from '@/lib/ai/types';

/** Parses organizer text into event fields using a model client, with a hard timeout (REQ-45, REQ-47). */
export class AiEventParser implements EventTextParser {
  constructor(private readonly deps: { client: AiModelClient; model: string }) {}

  /** Sends the prompt to the model within AI_TIMEOUT_MS and normalizes its raw output. */
  async parse(_request: {
    text: string;
    formTimezone: string | null;
    now: Date;
  }): Promise<ParseEventResult> {
    throw new Error('not implemented');
  }
}
