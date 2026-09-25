import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

describe('eval runner (REQ-91)', () => {
  it('REQ-91: the runner exits 2 when the API key is missing', () => {
    const env = { ...process.env };
    delete env.ANTHROPIC_API_KEY;
    delete env.OPENROUTER_API_KEY;
    const r = spawnSync(
      process.execPath,
      [
        '--import',
        'tsx',
        'evals/event-parser/run.ts',
        '--provider',
        'anthropic',
        '--model',
        'claude-haiku-4-5',
      ],
      { env, encoding: 'utf8', cwd: process.cwd() },
    );
    expect(r.status).toBe(2);
    expect(r.stderr).toContain('ANTHROPIC_API_KEY is not set');
  }, 30_000);
});

describe('eval runner provider (REQ-93)', () => {
  it('REQ-93: the runner defaults to OpenRouter and exits 2 when its key is missing', () => {
    const env = { ...process.env };
    delete env.ANTHROPIC_API_KEY;
    delete env.OPENROUTER_API_KEY;
    const r = spawnSync(
      process.execPath,
      ['--import', 'tsx', 'evals/event-parser/run.ts', '--model', 'openai/gpt-4o-mini'],
      { env, encoding: 'utf8', cwd: process.cwd() },
    );
    expect(r.status).toBe(2);
    expect(r.stderr).toContain('OPENROUTER_API_KEY is not set');
  }, 30_000);

  it('REQ-93: the runner exits 2 when the OpenRouter key is missing', () => {
    const env = { ...process.env };
    delete env.ANTHROPIC_API_KEY;
    delete env.OPENROUTER_API_KEY;
    const r = spawnSync(
      process.execPath,
      [
        '--import',
        'tsx',
        'evals/event-parser/run.ts',
        '--provider',
        'openrouter',
        '--model',
        'openai/gpt-4o-mini',
      ],
      { env, encoding: 'utf8', cwd: process.cwd() },
    );
    expect(r.status).toBe(2);
    expect(r.stderr).toContain('OPENROUTER_API_KEY is not set');
  }, 30_000);
});
