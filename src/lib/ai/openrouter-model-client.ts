import type { AiModelClient } from './types';

/** Default OpenRouter API base URL (OpenAI-compatible chat completions). */
export const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

/** Optional dependencies of the OpenRouter client; production uses the global fetch and process.env. */
export interface OpenRouterDeps {
  fetch?: typeof fetch;
  env?: Readonly<Record<string, string | undefined>>;
}

/** Structured-output model client for OpenRouter; the key and base URL are read on each call (REQ-94). */
export function createOpenRouterModelClient(_deps: OpenRouterDeps = {}): AiModelClient {
  return {
    async complete() {
      throw new Error('not implemented');
    },
  };
}
