import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const SELF = 'scripts/secrets-hygiene.test.ts';
const tracked = execFileSync('git', ['ls-files'], { encoding: 'utf8' }).split('\n').filter(Boolean);
const read = (path: string) => readFileSync(path, 'utf8');
const envValue = (content: string, name: string) =>
  content
    .split(/\r?\n/)
    .find((line) => line.startsWith(`${name}=`))
    ?.slice(name.length + 1)
    .trim();

describe('secrets hygiene (REQ-97)', () => {
  it('REQ-97: no public (browser) environment variable holds a key or secret', () => {
    const files = tracked.filter(
      (p) => p !== SELF && (/\.(ts|tsx|js|mjs|cjs|json)$/.test(p) || /(^|\/)\.env/.test(p)),
    );
    expect(files.filter((p) => /NEXT_PUBLIC_[A-Z0-9_]*(KEY|SECRET)/.test(read(p)))).toEqual([]);
  });
  it('REQ-97: client components never read keys or import server AI modules', () => {
    const clientFiles = tracked.filter(
      (p) => /\.(ts|tsx)$/.test(p) && /^\s*['"]use client['"]/.test(read(p)),
    );
    expect(clientFiles.length).toBeGreaterThan(0);
    expect(
      clientFiles.filter((p) => /API_KEY|@\/lib\/container|model-client/.test(read(p))),
    ).toEqual([]);
  });
  it('REQ-97: CI workflows never mention a provider key', () => {
    const workflows = tracked.filter((p) => p.startsWith('.github/workflows/'));
    expect(
      workflows.filter((p) =>
        /ANTHROPIC_API_KEY|OPENROUTER_API_KEY|OPENROUTER_MANAGE?MENT_KEY/.test(read(p)),
      ),
    ).toEqual([]);
  });
  it('REQ-97: committed env files hold only dummy keys and .env.local is ignored', () => {
    const test = read('.env.test');
    const example = read('.env.example');
    expect(envValue(test, 'ANTHROPIC_API_KEY')).toBe('test-key');
    expect(envValue(test, 'OPENROUTER_API_KEY')).toBe('test-key');
    expect(envValue(example, 'ANTHROPIC_API_KEY')).toBe('');
    expect(envValue(example, 'OPENROUTER_API_KEY')).toBe('');
    expect(tracked).not.toContain('.env.local');
    expect(() => execFileSync('git', ['check-ignore', '-q', '.env.local'])).not.toThrow();
  });
});
