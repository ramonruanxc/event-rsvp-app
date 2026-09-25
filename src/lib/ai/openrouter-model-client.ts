import { z } from 'zod';
import { InvalidModelOutputError, outageReasonForStatus, ProviderUnavailableError } from './errors';
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

/** Parses the model's JSON content, removing a Markdown code fence; unusable content is InvalidModelOutputError. */
function parseContent(content: string | null | undefined): unknown {
  if (typeof content !== 'string' || content.trim() === '') {
    throw new InvalidModelOutputError('model returned no content');
  }
  const text = content
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '');
  try {
    return JSON.parse(text);
  } catch {
    throw new InvalidModelOutputError('model content is not JSON');
  }
}

/** An outage for outage codes (REQ-88), else a plain error that is never retried (REQ-89). */
function failureForCode(code: number, source: 'HTTP' | 'error'): Error {
  const reason = outageReasonForStatus(code);
  return reason ? new ProviderUnavailableError(reason) : new Error(`OpenRouter ${source} ${code}`);
}

/** Structured-output model client for OpenRouter; the key and base URL are read on each call (REQ-94). */
export function createOpenRouterModelClient(deps: OpenRouterDeps = {}): AiModelClient {
  return {
    async complete({ system, user, model, timeoutMs }) {
      const env = deps.env ?? process.env;
      const apiKey = env.OPENROUTER_API_KEY?.trim();
      if (!apiKey) throw new Error('OPENROUTER_API_KEY is not set');
      const baseUrl = (env.OPENROUTER_BASE_URL?.trim() || OPENROUTER_BASE_URL).replace(/\/+$/, '');
      const fetchImpl = deps.fetch ?? fetch;

      const send = async (): Promise<{ status: number; text: string }> => {
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
          return { status: response.status, text: await response.text() };
        } catch {
          throw new ProviderUnavailableError(controller.signal.aborted ? 'timeout' : 'network');
        } finally {
          clearTimeout(timer);
        }
      };

      const { status, text } = await send();
      if (status < 200 || status >= 300) throw failureForCode(status, 'HTTP');
      let json: unknown;
      try {
        json = JSON.parse(text);
      } catch {
        throw new ProviderUnavailableError('server'); // a 200 that is not JSON is a gateway problem, not model output
      }
      const envelope = completionSchema.safeParse(json);
      if (!envelope.success) throw new ProviderUnavailableError('server');
      if (envelope.data.error) throw failureForCode(envelope.data.error.code, 'error');
      return parseContent(envelope.data.choices?.[0]?.message?.content);
    },
  };
}
