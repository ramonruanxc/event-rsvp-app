import { describe, expect, it, vi } from 'vitest';
import { AiUnavailableError } from '@/domain/errors';
import { AiEventParser } from '@/services/ai-event-parser';
import { ProviderUnavailableError } from './errors';
import { buildAiProviders, DEFAULT_AI_PROVIDERS, parseAiProviders } from './providers-config';
import type { AiModelClient } from './types';

describe('parseAiProviders', () => {
  it('REQ-86: without AI_PROVIDERS only OpenRouter is used', () => {
    expect(parseAiProviders(undefined)).toEqual(['openrouter']);
    expect(parseAiProviders('')).toEqual(['openrouter']);
    expect(parseAiProviders('   ')).toEqual(['openrouter']);
    expect(DEFAULT_AI_PROVIDERS).toEqual(['openrouter']);
  });

  it('REQ-86: AI_PROVIDERS sets the order and Anthropic is used only when listed', () => {
    expect(parseAiProviders('openrouter,anthropic')).toEqual(['openrouter', 'anthropic']);
    expect(parseAiProviders('anthropic,openrouter')).toEqual(['anthropic', 'openrouter']);
    expect(parseAiProviders(' OpenRouter , anthropic ,')).toEqual(['openrouter', 'anthropic']);
    expect(parseAiProviders('openrouter')).toEqual(['openrouter']);
    expect(parseAiProviders('anthropic')).toEqual(['anthropic']);
    expect(parseAiProviders('anthropic,anthropic')).toEqual(['anthropic']);
    expect(parseAiProviders('anthropic,mistral')).toEqual(['anthropic']);
    expect(parseAiProviders('mistral')).toEqual([]);
  });
});

describe('buildAiProviders', () => {
  const anthropicClient: AiModelClient = { complete: vi.fn() };
  const openrouterClient: AiModelClient = { complete: vi.fn() };
  const makeFactories = () => ({
    anthropic: vi.fn(() => anthropicClient),
    openrouter: vi.fn(() => openrouterClient),
  });

  it('REQ-86: without AI_PROVIDERS only OpenRouter is used, even when both keys are set', () => {
    const f = makeFactories();
    expect(buildAiProviders({ ANTHROPIC_API_KEY: 'a', OPENROUTER_API_KEY: 'o' }, f)).toEqual([
      { name: 'openrouter', client: openrouterClient, model: 'anthropic/claude-haiku-4.5' },
    ]);
    expect(f.anthropic).not.toHaveBeenCalled();
  });

  it('REQ-86: with both keys the providers follow AI_PROVIDERS with their default models', () => {
    expect(
      buildAiProviders(
        { AI_PROVIDERS: 'anthropic,openrouter', ANTHROPIC_API_KEY: 'a', OPENROUTER_API_KEY: 'o' },
        makeFactories(),
      ),
    ).toEqual([
      { name: 'anthropic', client: anthropicClient, model: 'claude-haiku-4-5' },
      { name: 'openrouter', client: openrouterClient, model: 'anthropic/claude-haiku-4.5' },
    ]);

    expect(
      buildAiProviders(
        { AI_PROVIDERS: 'openrouter,anthropic', ANTHROPIC_API_KEY: 'a', OPENROUTER_API_KEY: 'o' },
        makeFactories(),
      ).map((p) => p.name),
    ).toEqual(['openrouter', 'anthropic']);
  });

  it('REQ-87: a listed provider without a key is skipped and its client is never created', async () => {
    const f = makeFactories();
    expect(
      buildAiProviders(
        { AI_PROVIDERS: 'anthropic,openrouter', OPENROUTER_API_KEY: 'o', ANTHROPIC_API_KEY: '   ' },
        f,
      ),
    ).toEqual([
      { name: 'openrouter', client: openrouterClient, model: 'anthropic/claude-haiku-4.5' },
    ]);
    expect(
      buildAiProviders({ AI_PROVIDERS: 'anthropic,openrouter', OPENROUTER_API_KEY: 'o' }, f),
    ).toEqual([
      { name: 'openrouter', client: openrouterClient, model: 'anthropic/claude-haiku-4.5' },
    ]);
    expect(f.anthropic).not.toHaveBeenCalled();

    const f2 = makeFactories();
    expect(buildAiProviders({}, f2)).toEqual([]);
    expect(f2.anthropic).not.toHaveBeenCalled();
    expect(f2.openrouter).not.toHaveBeenCalled();

    await expect(
      new AiEventParser({ providers: [] }).parse({
        text: 'Dinner',
        formTimezone: null,
        now: new Date('2026-09-24T15:00:00.000Z'),
      }),
    ).rejects.toBeInstanceOf(AiUnavailableError);
  });

  it('REQ-87: model variables override the defaults and blank means default', () => {
    expect(
      buildAiProviders(
        {
          AI_PROVIDERS: 'anthropic,openrouter',
          ANTHROPIC_API_KEY: 'a',
          OPENROUTER_API_KEY: 'o',
          AI_MODEL: 'claude-sonnet-5',
          OPENROUTER_MODEL: 'openai/gpt-4o-mini',
        },
        makeFactories(),
      ).map((p) => p.model),
    ).toEqual(['claude-sonnet-5', 'openai/gpt-4o-mini']);

    expect(
      buildAiProviders(
        {
          AI_PROVIDERS: 'anthropic,openrouter',
          ANTHROPIC_API_KEY: 'a',
          OPENROUTER_API_KEY: 'o',
          AI_MODEL: '  ',
          OPENROUTER_MODEL: '',
        },
        makeFactories(),
      ).map((p) => p.model),
    ).toEqual(['claude-haiku-4-5', 'anthropic/claude-haiku-4.5']);
  });

  it('REQ-88: with the default configuration there is no failover', async () => {
    const anthropicComplete = vi.fn();
    const openrouterComplete = vi.fn().mockRejectedValue(new ProviderUnavailableError('server'));
    const providers = buildAiProviders(
      { ANTHROPIC_API_KEY: 'a', OPENROUTER_API_KEY: 'o' },
      {
        anthropic: () => ({ complete: anthropicComplete }),
        openrouter: () => ({ complete: openrouterComplete }),
      },
    );

    await expect(
      new AiEventParser({ providers }).parse({
        text: 'Dinner',
        formTimezone: null,
        now: new Date('2026-09-24T15:00:00.000Z'),
      }),
    ).rejects.toBeInstanceOf(AiUnavailableError);
    expect(openrouterComplete).toHaveBeenCalledTimes(1);
    expect(anthropicComplete).not.toHaveBeenCalled();
  });
});
