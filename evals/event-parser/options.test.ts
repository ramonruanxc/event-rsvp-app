import { describe, expect, it } from 'vitest';
import { parseEvalOptions, reportFileName, reportLabel } from './options';

describe('eval options (REQ-93)', () => {
  it('REQ-93: defaults to OpenRouter and the default cases and output paths', () => {
    expect(
      parseEvalOptions(['--model', 'openai/gpt-4o-mini'], { OPENROUTER_API_KEY: 'y' }),
    ).toEqual({
      provider: 'openrouter',
      model: 'openai/gpt-4o-mini',
      cases: 'evals/event-parser/cases.json',
      out: 'docs/evals',
      runs: 3,
      reasoningEffort: 'low',
    });
    expect(parseEvalOptions(['--model', 'openai/gpt-4o-mini'], { ANTHROPIC_API_KEY: 'x' })).toEqual(
      { error: 'OPENROUTER_API_KEY is not set — ask the human to provide it.' },
    );
  });

  it('REQ-93: --provider anthropic needs ANTHROPIC_API_KEY', () => {
    expect(
      parseEvalOptions(['--provider', 'anthropic', '--model', 'claude-haiku-4-5'], {
        OPENROUTER_API_KEY: 'y',
      }),
    ).toEqual({ error: 'ANTHROPIC_API_KEY is not set — ask the human to provide it.' });
    expect(
      parseEvalOptions(['--provider', 'anthropic', '--model', 'claude-haiku-4-5'], {
        ANTHROPIC_API_KEY: 'x',
      }),
    ).toEqual({
      provider: 'anthropic',
      model: 'claude-haiku-4-5',
      cases: 'evals/event-parser/cases.json',
      out: 'docs/evals',
      runs: 3,
      reasoningEffort: 'low',
    });
  });

  it('REQ-93: --provider openrouter is accepted explicitly', () => {
    const result = parseEvalOptions(['--provider', 'openrouter', '--model', 'openai/gpt-4o-mini'], {
      OPENROUTER_API_KEY: 'y',
    });
    expect(result).toEqual({
      provider: 'openrouter',
      model: 'openai/gpt-4o-mini',
      cases: 'evals/event-parser/cases.json',
      out: 'docs/evals',
      runs: 3,
      reasoningEffort: 'low',
    });
  });

  it('REQ-93: rejects an unknown provider, a missing key and a missing model, in that order', () => {
    expect(parseEvalOptions(['--provider', 'mistral', '--model', 'm'], {})).toEqual({
      error: '--provider must be one of: anthropic, openrouter',
    });
    expect(parseEvalOptions([], {})).toEqual({
      error: 'OPENROUTER_API_KEY is not set — ask the human to provide it.',
    });
    expect(parseEvalOptions(['--provider', 'anthropic'], {})).toEqual({
      error: 'ANTHROPIC_API_KEY is not set — ask the human to provide it.',
    });
    expect(parseEvalOptions([], { OPENROUTER_API_KEY: 'y' })).toEqual({
      error: '--model is required',
    });
    expect(parseEvalOptions(['--provider', 'anthropic'], { ANTHROPIC_API_KEY: 'x' })).toEqual({
      error: '--model is required',
    });
  });

  it('REQ-93: report label and file name', () => {
    expect(reportLabel('anthropic', 'claude-haiku-4-5')).toBe('claude-haiku-4-5');
    expect(reportLabel('openrouter', 'openai/gpt-4o-mini')).toBe('openrouter:openai/gpt-4o-mini');
    expect(reportFileName('2026-09-24', 'anthropic', 'claude-haiku-4-5')).toBe(
      '2026-09-24-claude-haiku-4-5.md',
    );
    expect(reportFileName('2026-09-24', 'openrouter', 'anthropic/claude-haiku-4.5')).toBe(
      '2026-09-24-openrouter-anthropic-claude-haiku-4.5.md',
    );
    expect(reportFileName('2026-09-24', 'openrouter', 'openai/gpt-4o-mini')).toBe(
      '2026-09-24-openrouter-openai-gpt-4o-mini.md',
    );
  });
});

describe('eval options (REQ-107)', () => {
  it('REQ-107: --runs defaults to 3 and the reasoning effort to OPENROUTER_REASONING_EFFORT or low', () => {
    expect(parseEvalOptions(['--model', 'm'], { OPENROUTER_API_KEY: 'y' })).toEqual({
      provider: 'openrouter',
      model: 'm',
      cases: 'evals/event-parser/cases.json',
      out: 'docs/evals',
      runs: 3,
      reasoningEffort: 'low',
    });
    expect(
      parseEvalOptions(['--model', 'm'], {
        OPENROUTER_API_KEY: 'y',
        OPENROUTER_REASONING_EFFORT: ' Medium ',
      }),
    ).toMatchObject({ runs: 3, reasoningEffort: 'medium' });
  });

  it('REQ-107: --runs and --reasoning-effort are validated after the model', () => {
    expect(
      parseEvalOptions(['--model', 'm', '--runs', '5', '--reasoning-effort', 'OMIT'], {
        OPENROUTER_API_KEY: 'y',
        OPENROUTER_REASONING_EFFORT: 'high',
      }),
    ).toMatchObject({ runs: 5, reasoningEffort: 'omit' });
    for (const value of ['0', '2.5', 'abc', '']) {
      expect(
        parseEvalOptions(['--model', 'm', '--runs', value], { OPENROUTER_API_KEY: 'y' }),
      ).toEqual({ error: '--runs must be a positive integer' });
    }
    expect(
      parseEvalOptions(['--model', 'm', '--reasoning-effort', 'turbo'], {
        OPENROUTER_API_KEY: 'y',
      }),
    ).toEqual({
      error:
        '--reasoning-effort must be one of: max, xhigh, high, medium, low, minimal, none, omit',
    });
    expect(parseEvalOptions(['--runs', '0'], { OPENROUTER_API_KEY: 'y' })).toEqual({
      error: '--model is required',
    });
  });
});
