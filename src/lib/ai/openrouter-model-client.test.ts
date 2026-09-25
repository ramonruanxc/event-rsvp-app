import { describe, expect, it, vi } from 'vitest';
import { AI_OUTPUT_JSON_SCHEMA } from './output';
import { createOpenRouterModelClient } from './openrouter-model-client';

const RAW = {
  isEvent: true,
  name: 'Team dinner',
  description: 'Dinner with the team.',
  date: '2026-10-02',
  time: '19:00',
  timezone: null,
  location: "Mario's",
};
const completion = (content: string | null) => ({
  id: 'gen-1',
  object: 'chat.completion',
  created: 0,
  model: 'openai/gpt-4o-mini',
  choices: [{ index: 0, finish_reason: 'stop', message: { role: 'assistant', content } }],
  usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
});
const reply = (status: number, body: unknown) =>
  new Response(typeof body === 'string' ? body : JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
const fakeFetch = (make: () => Response) => vi.fn(async () => make()); // a fresh Response per call
const client = (
  fetchMock: unknown,
  env: Record<string, string | undefined> = { OPENROUTER_API_KEY: 'test-key' },
) => createOpenRouterModelClient({ fetch: fetchMock as typeof fetch, env });
const REQ = { system: 'sys', user: 'user', model: 'openai/gpt-4o-mini' };
const callOf = (fetchMock: { mock: { calls: unknown[][] } }, i = 0) =>
  fetchMock.mock.calls[i] as unknown as [string, RequestInit];

describe('createOpenRouterModelClient', () => {
  it('REQ-94: posts a strict JSON-schema chat completion to OpenRouter', async () => {
    const fetchMock = fakeFetch(() => reply(200, completion(JSON.stringify(RAW))));
    await client(fetchMock).complete(REQ);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = callOf(fetchMock);
    expect(url).toBe('https://openrouter.ai/api/v1/chat/completions');
    expect(init.method).toBe('POST');
    expect(init.headers).toEqual({ Authorization: 'Bearer test-key', 'Content-Type': 'application/json' });
    expect(init.signal).toBeInstanceOf(AbortSignal);
    expect(JSON.parse(init.body as string)).toEqual({
      model: 'openai/gpt-4o-mini',
      max_tokens: 1024,
      messages: [
        { role: 'system', content: 'sys' },
        { role: 'user', content: 'user' },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: { name: 'event_fields', strict: true, schema: AI_OUTPUT_JSON_SCHEMA },
      },
      provider: { require_parameters: true },
    });
  });

  it('REQ-94: returns the parsed JSON content of the first choice', async () => {
    const fetchMock = fakeFetch(() => reply(200, completion(JSON.stringify(RAW))));
    await expect(client(fetchMock).complete(REQ)).resolves.toEqual(RAW);
  });

  it('REQ-94: reads the key and base URL on each call, never at creation', async () => {
    const fetchMock = fakeFetch(() => reply(200, completion(JSON.stringify(RAW))));
    const env: Record<string, string | undefined> = {};
    const c = client(fetchMock, env);

    await expect(c.complete(REQ)).rejects.toThrow('OPENROUTER_API_KEY is not set');
    expect(fetchMock).not.toHaveBeenCalled();

    env.OPENROUTER_API_KEY = 'k2';
    env.OPENROUTER_BASE_URL = 'http://127.0.0.1:4020/api/v1/';
    await c.complete(REQ);

    const [url, init] = callOf(fetchMock);
    expect(url).toBe('http://127.0.0.1:4020/api/v1/chat/completions');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer k2');
  });
});
