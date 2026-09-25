import { describe, expect, it, vi } from 'vitest';
import { InvalidModelOutputError, ProviderUnavailableError } from './errors';
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
const failureOf = (
  fetchMock: unknown,
  request: { system: string; user: string; model: string; timeoutMs?: number } = REQ,
) =>
  client(fetchMock)
    .complete(request)
    .then(
      () => {
        throw new Error('expected a rejection');
      },
      (error: unknown) => error,
    );

describe('createOpenRouterModelClient', () => {
  it('REQ-94: posts a strict JSON-schema chat completion to OpenRouter', async () => {
    const fetchMock = fakeFetch(() => reply(200, completion(JSON.stringify(RAW))));
    await client(fetchMock).complete(REQ);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = callOf(fetchMock);
    expect(url).toBe('https://openrouter.ai/api/v1/chat/completions');
    expect(init.method).toBe('POST');
    expect(init.headers).toEqual({
      Authorization: 'Bearer test-key',
      'Content-Type': 'application/json',
    });
    expect(init.signal).toBeInstanceOf(AbortSignal);
    expect(JSON.parse(init.body as string)).toEqual({
      model: 'openai/gpt-4o-mini',
      max_tokens: 2048,
      messages: [
        { role: 'system', content: 'sys' },
        { role: 'user', content: 'user' },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: { name: 'event_fields', strict: true, schema: AI_OUTPUT_JSON_SCHEMA },
      },
      provider: { require_parameters: true },
      reasoning: { effort: 'low' },
    });
  });

  it('REQ-99: sends the reasoning effort from OPENROUTER_REASONING_EFFORT, read on each call', async () => {
    const fetchMock = fakeFetch(() => reply(200, completion(JSON.stringify(RAW))));
    const env: Record<string, string | undefined> = { OPENROUTER_API_KEY: 'test-key' };
    const c = client(fetchMock, env);
    const bodyOf = (i: number) =>
      JSON.parse(callOf(fetchMock, i)[1].body as string) as Record<string, unknown>;
    const cases: [string | undefined, unknown][] = [
      [' MEDIUM ', { effort: 'medium' }],
      ['None', { effort: 'none' }],
      ['minimal', { effort: 'minimal' }],
      ['turbo', { effort: 'low' }],
      [undefined, { effort: 'low' }],
    ];
    for (const [i, [value, expected]] of cases.entries()) {
      env.OPENROUTER_REASONING_EFFORT = value;
      await c.complete(REQ);
      expect(bodyOf(i).reasoning, String(value)).toEqual(expected);
      expect(bodyOf(i).max_tokens).toBe(2048);
    }
    env.OPENROUTER_REASONING_EFFORT = 'omit';
    await c.complete(REQ);
    expect('reasoning' in bodyOf(cases.length)).toBe(false);
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

  it('REQ-89: content that is missing, blank or not JSON is InvalidModelOutputError', async () => {
    const bodies = [
      completion('not json'),
      completion(null),
      completion('   '),
      { ...completion(null), choices: [] },
    ];
    for (const body of bodies) {
      await expect(client(fakeFetch(() => reply(200, body))).complete(REQ)).rejects.toBeInstanceOf(
        InvalidModelOutputError,
      );
    }
  });

  it('REQ-94: a Markdown code fence around the JSON is removed', async () => {
    const fenced = '```json\n' + JSON.stringify(RAW) + '\n```';
    const bare = '```\n' + JSON.stringify(RAW) + '\n```';
    await expect(
      client(fakeFetch(() => reply(200, completion(fenced)))).complete(REQ),
    ).resolves.toEqual(RAW);
    await expect(
      client(fakeFetch(() => reply(200, completion(bare)))).complete(REQ),
    ).resolves.toEqual(RAW);
  });

  it('REQ-88: OpenRouter outages become ProviderUnavailableError with a reason', async () => {
    const cases: [() => ReturnType<typeof fakeFetch>, string][] = [
      [() => fakeFetch(() => reply(401, { error: { code: 401, message: 'x' } })), 'auth'],
      [() => fakeFetch(() => reply(403, { error: { code: 403, message: 'x' } })), 'auth'],
      [() => fakeFetch(() => reply(402, { error: { code: 402, message: 'x' } })), 'credit'],
      [() => fakeFetch(() => reply(408, { error: { code: 408, message: 'x' } })), 'timeout'],
      [() => fakeFetch(() => reply(429, { error: { code: 429, message: 'x' } })), 'rate-limit'],
      [() => fakeFetch(() => reply(500, { error: { code: 500, message: 'x' } })), 'server'],
      [() => fakeFetch(() => reply(502, { error: { code: 502, message: 'x' } })), 'server'],
      [() => fakeFetch(() => reply(503, { error: { code: 503, message: 'x' } })), 'server'],
      [
        () => fakeFetch(() => reply(200, { error: { code: 502, message: 'upstream failed' } })),
        'server',
      ],
      [
        () => fakeFetch(() => reply(200, { error: { code: 429, message: 'Rate limit exceeded' } })),
        'rate-limit',
      ],
      [
        () => fakeFetch(() => reply(200, { error: { code: 403, message: 'Key is disabled' } })),
        'auth',
      ],
      [() => fakeFetch(() => reply(200, 'oops')), 'server'],
      [() => vi.fn().mockRejectedValue(new TypeError('fetch failed')), 'network'],
    ];
    for (const [makeFetchMock, reason] of cases) {
      const error = await failureOf(makeFetchMock());
      expect(error).toBeInstanceOf(ProviderUnavailableError);
      expect((error as ProviderUnavailableError).reason).toBe(reason);
      expect((error as Error).message).not.toContain('test-key');
    }
  });

  it('REQ-88: a request longer than timeoutMs is aborted as a timeout', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const hanging = vi.fn(
      (_url: string, init: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init.signal?.addEventListener('abort', () =>
            reject(new DOMException('The operation was aborted.', 'AbortError')),
          );
        }),
    );
    const pending = failureOf(hanging, { ...REQ, timeoutMs: 2_000 });
    await vi.advanceTimersByTimeAsync(2_000);
    const error = await pending;
    vi.useRealTimers();
    expect(error).toBeInstanceOf(ProviderUnavailableError);
    expect((error as ProviderUnavailableError).reason).toBe('timeout');
  });

  it('REQ-89: other HTTP errors are neither outages nor invalid output, and never show the key', async () => {
    for (const status of [400, 404, 422]) {
      const error = await failureOf(
        fakeFetch(() => reply(status, { error: { code: status, message: 'nope' } })),
      );
      expect(error).toBeInstanceOf(Error);
      expect(error).not.toBeInstanceOf(ProviderUnavailableError);
      expect(error).not.toBeInstanceOf(InvalidModelOutputError);
      expect((error as Error).message).toBe(`OpenRouter HTTP ${status}`);
      expect((error as Error).message).not.toContain('test-key');
    }

    const error200 = await failureOf(
      fakeFetch(() => reply(200, { error: { code: 400, message: 'bad' } })),
    );
    expect((error200 as Error).message).toBe('OpenRouter error 400');
    expect((error200 as Error).message).not.toContain('test-key');
  });
});
