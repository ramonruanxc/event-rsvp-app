import { describe, expect, it, vi } from 'vitest';
import type Anthropic from '@anthropic-ai/sdk';
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
  it('REQ-47: calls the API with a 10 second timeout and no retries', async () => {
    const model = createAnthropicModelClient(client);

    await model.complete({ system: 'sys', user: 'user', model: 'claude-haiku-4-5' });

    expect(parse.mock.calls[0][1]).toEqual({ timeout: 10_000, maxRetries: 0 });
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
});
