import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import net, { type AddressInfo } from 'node:net';
import os from 'node:os';
import path from 'node:path';
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

const freePort = () =>
  new Promise<number>((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address() as AddressInfo;
      server.close(() => resolve(port));
    });
  });
const SMOKE_CASE = {
  id: 'smoke-01',
  category: 'explicit',
  input: {
    text: "Team dinner on October 4, 2030 at 7pm at Mario's",
    timezone: 'America/New_York',
    now: '2026-09-24T15:00:00Z',
  },
  expected: {
    name: { includes: 'dinner' },
    date: '2030-10-04',
    time: '19:00',
    timezone: 'America/New_York',
    location: { includes: 'mario' },
  },
};

describe('eval runner runs (REQ-100)', () => {
  it(
    'REQ-100: the runner sends each case --runs times through the mock and writes the Phase 8 report',
    async () => {
      const port = await freePort();
      const mock = spawn(process.execPath, ['e2e/mock-openrouter.mjs'], {
        env: { ...process.env, MOCK_OPENROUTER_PORT: String(port) },
        stdio: ['ignore', 'pipe', 'inherit'],
      });
      try {
        await new Promise<void>((resolve, reject) => {
          mock.stdout.on('data', (chunk: Buffer) => {
            if (chunk.toString().includes('listening')) resolve();
          });
          mock.once('exit', (code) => reject(new Error(`mock exited with ${code}`)));
        });
        const dir = mkdtempSync(path.join(os.tmpdir(), 'eval-runner-'));
        const casesPath = path.join(dir, 'cases.json');
        writeFileSync(casesPath, JSON.stringify([SMOKE_CASE]), 'utf8');
        const outDir = path.join(dir, 'out');
        const env = {
          ...process.env,
          OPENROUTER_API_KEY: 'test-key',
          OPENROUTER_BASE_URL: `http://127.0.0.1:${port}/api/v1`,
        };
        const r = spawnSync(
          process.execPath,
          [
            '--import',
            'tsx',
            'evals/event-parser/run.ts',
            '--model',
            'openai/gpt-4o-mini',
            '--runs',
            '2',
            '--reasoning-effort',
            'omit',
            '--cases',
            casesPath,
            '--out',
            outDir,
          ],
          { env, encoding: 'utf8', cwd: process.cwd() },
        );
        expect(r.status, r.stderr).toBe(0);
        const files = readdirSync(outDir);
        expect(files).toHaveLength(1);
        expect(files[0]).toMatch(/^\d{4}-\d{2}-\d{2}-openrouter-openai-gpt-4o-mini\.md$/);
        const md = readFileSync(path.join(outDir, files[0]), 'utf8');
        expect(md).toContain('**Gate:** PASS');
        expect(md).toContain('**Runs per case:** 2 · **Reasoning effort:** omit');
        expect(md).toContain('**Availability:** 100% (2/2 runs answered; timeouts: 0, outages: 0)');
        expect(md).toContain('| explicit | 1 | 1 | 100% |');
      } finally {
        mock.kill();
      }
    },
    60_000,
  );
});
