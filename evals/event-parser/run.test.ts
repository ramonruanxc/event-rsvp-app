import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

describe('eval runner (REQ-91)', () => {
  it('REQ-91: the runner exits 2 when the API key is missing', () => {
    const env = { ...process.env };
    delete env.ANTHROPIC_API_KEY;
    const r = spawnSync(
      process.execPath,
      ['--import', 'tsx', 'evals/event-parser/run.ts', '--model', 'claude-haiku-4-5'],
      { env, encoding: 'utf8', cwd: process.cwd() },
    );
    expect(r.status).toBe(2);
    expect(r.stderr).toContain('ANTHROPIC_API_KEY is not set');
  }, 30_000);
});
