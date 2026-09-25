import { describe, expect, it, vi } from 'vitest';
import type Anthropic from '@anthropic-ai/sdk';
import {
  AnthropicError,
  APIConnectionError,
  APIConnectionTimeoutError,
  APIError,
} from '@anthropic-ai/sdk';
import { InvalidModelOutputError, ProviderUnavailableError } from './errors';
import { createAnthropicModelClient } from './anthropic-model-client';

const parse = vi.fn().mockResolvedValue({
  parsed_output: {
    isEvent: true,
    name: 'x',
    description: null,
    date: null,
    time: null,
    timezone: null,
    location: null,
  },
});
const client = { messages: { parse } } as unknown as Anthropic;

describe('createAnthropicModelClient', () => {
  it('REQ-133: calls the API with a 20 second timeout and no retries', async () => {
    const model = createAnthropicModelClient(client);

    await model.complete({ system: 'sys', user: 'user', model: 'claude-haiku-4-5' });

    expect(parse.mock.calls[0][1]).toEqual({ timeout: 20_000, maxRetries: 0 });
  });

  it('REQ-43: requests structured output and returns the parsed object', async () => {
    const model = createAnthropicModelClient(client);

    const result = await model.complete({ system: 'sys', user: 'user', model: 'claude-haiku-4-5' });

    const [request] = parse.mock.calls.at(-1) as [Record<string, unknown>, unknown];
    expect(request.model).toBe('claude-haiku-4-5');
    expect(request.system).toBe('sys');
    expect(request.messages).toEqual([{ role: 'user', content: 'user' }]);
    expect(request.output_config).toMatchObject({ format: expect.any(Object) });
    expect(result).toEqual({
      isEvent: true,
      name: 'x',
      description: null,
      date: null,
      time: null,
      timezone: null,
      location: null,
    });
  });

  it('REQ-43: no structured output is an error', async () => {
    parse.mockResolvedValueOnce({ parsed_output: null });
    const model = createAnthropicModelClient(client);

    await expect(
      model.complete({ system: 'sys', user: 'user', model: 'claude-haiku-4-5' }),
    ).rejects.toThrow('model returned no structured output');
  });

  it('REQ-88: passes the time left in the budget as the SDK timeout', async () => {
    const localParse = vi.fn().mockResolvedValue({
      parsed_output: {
        isEvent: true,
        name: 'x',
        description: null,
        date: null,
        time: null,
        timezone: null,
        location: null,
      },
    });
    const local = { messages: { parse: localParse } } as unknown as Anthropic;

    await createAnthropicModelClient(local).complete({
      system: 'sys',
      user: 'user',
      model: 'claude-haiku-4-5',
      timeoutMs: 4_000,
    });

    expect(localParse.mock.calls[0][1]).toEqual({ timeout: 4_000, maxRetries: 0 });
  });
});

const apiError = (status: number, type: string, message: string) =>
  new APIError(status, { type: 'error', error: { type, message } }, undefined, new Headers());
const failureOf = (parseImpl: unknown) =>
  createAnthropicModelClient({ messages: { parse: parseImpl } } as unknown as Anthropic)
    .complete({ system: 'sys', user: 'user', model: 'claude-haiku-4-5' })
    .then(
      () => {
        throw new Error('expected a rejection');
      },
      (error: unknown) => error,
    );

describe('createAnthropicModelClient — failures', () => {
  it('REQ-88: Anthropic outages become ProviderUnavailableError with a reason', async () => {
    const cases: [unknown, string][] = [
      [new APIConnectionTimeoutError(), 'timeout'],
      [new APIConnectionError({ message: 'Connection error.' }), 'network'],
      [apiError(529, 'overloaded_error', 'Overloaded'), 'server'],
      [apiError(500, 'api_error', 'Internal server error'), 'server'],
      [apiError(429, 'rate_limit_error', 'Rate limited'), 'rate-limit'],
      [apiError(402, 'billing_error', 'Billing issue'), 'credit'],
      [
        apiError(
          400,
          'invalid_request_error',
          'Your credit balance is too low to access the Anthropic API. Please go to Plans & Billing to upgrade or purchase credits.',
        ),
        'credit',
      ],
      [apiError(401, 'authentication_error', 'invalid x-api-key'), 'auth'],
      [
        apiError(
          403,
          'permission_error',
          'Your API key does not have permission to use the specified resource.',
        ),
        'auth',
      ],
    ];
    for (const [error, reason] of cases) {
      const e = await failureOf(vi.fn().mockRejectedValue(error));
      expect(e).toBeInstanceOf(ProviderUnavailableError);
      expect((e as ProviderUnavailableError).reason).toBe(reason);
    }
  });

  it('REQ-89: unusable output is InvalidModelOutputError and other errors pass through unchanged', async () => {
    const noOutput = await failureOf(vi.fn().mockResolvedValue({ parsed_output: null }));
    expect(noOutput).toBeInstanceOf(InvalidModelOutputError);
    expect((noOutput as Error).message).toBe('model returned no structured output');

    const parseFailure = await failureOf(
      vi.fn().mockRejectedValue(new AnthropicError('Failed to parse structured output: bad json')),
    );
    expect(parseFailure).toBeInstanceOf(InvalidModelOutputError);

    for (const err of [
      apiError(400, 'invalid_request_error', 'max_tokens: Field required'),
      apiError(404, 'not_found_error', 'model: claude-x'),
      apiError(422, 'invalid_request_error', 'unprocessable'),
    ]) {
      expect(await failureOf(vi.fn().mockRejectedValue(err))).toBe(err);
    }
  });
});
