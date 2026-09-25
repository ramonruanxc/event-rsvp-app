import { z } from 'zod';
import { AI_OUTPUT_JSON_SCHEMA } from './output';
import { AI_TIMEOUT_MS, type AiModelClient } from './types';

/** Default OpenRouter API base URL (OpenAI-compatible chat completions). */
export const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

/** Optional dependencies of the OpenRouter client; production uses the global fetch and process.env. */
export interface OpenRouterDeps {
  fetch?: typeof fetch;
  env?: Readonly<Record<string, string | undefined>>;
}

const completionSchema = z.object({
  choices: z
    .array(z.object({ message: z.object({ content: z.string().nullable().optional() }).optional() }))
    .optional(),
  error: z.object({ code: z.number(), message: z.string().optional() }).optional(),
});

/** Structured-output model client for OpenRouter; the key and base URL are read on each call (REQ-94). */
export function createOpenRouterModelClient(deps: OpenRouterDeps = {}): AiModelClient {
  return {
    async complete({ system, user, model, timeoutMs }) {
      const env = deps.env ?? process.env;
      const apiKey = env.OPENROUTER_API_KEY?.trim();
      if (!apiKey) throw new Error('OPENROUTER_API_KEY is not set');
      const baseUrl = (env.OPENROUTER_BASE_URL?.trim() || OPENROUTER_BASE_URL).replace(/\/+$/, '');
      const fetchImpl = deps.fetch ?? fetch;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs ?? AI_TIMEOUT_MS);
      try {
        const response = await fetchImpl(`${baseUrl}/chat/completions`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            max_tokens: 1024,
            messages: [
              { role: 'system', content: system },
              { role: 'user', content: user },
            ],
            response_format: {
              type: 'json_schema',
              json_schema: { name: 'event_fields', strict: true, schema: AI_OUTPUT_JSON_SCHEMA },
            },
            provider: { require_parameters: true },
          }),
          signal: controller.signal,
        });
        const envelope = completionSchema.parse(JSON.parse(await response.text()));
        return JSON.parse(envelope.choices?.[0]?.message?.content ?? '');
      } finally {
        clearTimeout(timer);
      }
    },
  };
}
