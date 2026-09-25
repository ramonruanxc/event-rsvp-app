import { describe, expect, it } from 'vitest';
import { DEFAULT_AI_PROVIDERS, parseAiProviders } from './providers-config';

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
