import { describe, expect, it, vi } from 'vitest';
import { fakeHttp, type FakeRoute } from './fake-http';
import { runProvisionCli } from './cli';

const BASE = 'https://openrouter.ai/api/v1';
const LIST = (offset: number) => `${BASE}/keys?include_disabled=true&offset=${offset}`;
/** A key as the API returns it (extra fields are ignored by the client). */
const apiKey = (name: string, extra: Record<string, unknown> = {}) => ({
  hash: `h-${name}`,
  name,
  label: name,
  limit: 3,
  usage: 0.12,
  disabled: false,
  created_at: '2026-09-24T10:00:00Z',
  ...extra,
});

function harness(
  routes: FakeRoute[],
  files: Record<string, string> = {},
  env: Record<string, string | undefined> = { OPENROUTER_MANAGMENT_KEY: 'mgmt-secret' },
) {
  const http = fakeHttp(routes);
  const store = new Map(Object.entries(files));
  const out: string[] = [];
  const err: string[] = [];
  const writeFile = vi.fn((path: string, content: string) => {
    store.set(path, content);
  });
  const run = (argv: string[] = []) =>
    runProvisionCli({
      argv,
      env,
      fetch: http.fetch,
      readFile: (path) => store.get(path),
      writeFile,
      out: (l) => out.push(l),
      err: (l) => err.push(l),
    });
  return { http, store, out, err, writeFile, run, printed: () => [...out, ...err].join('\n') };
}

const CREATE = (name: string, extra: Record<string, unknown> = {}): FakeRoute => ({
  method: 'POST',
  url: `${BASE}/keys`,
  status: 201,
  body: { data: apiKey(name, { usage: 0, ...extra }), key: 'sk-or-v1-secret' },
});

describe('runProvisionCli (REQ-98, REQ-97)', () => {
  it('REQ-98: creates the key, writes it to the env file and prints only name, limit and usage', async () => {
    const h = harness(
      [{ method: 'GET', url: LIST(0), status: 200, body: { data: [] } }, CREATE('event-rsvp-app')],
      { '.env.local': 'A=1\n' },
    );
    await expect(h.run()).resolves.toBe(0);
    expect(h.store.get('.env.local')).toBe('A=1\nOPENROUTER_API_KEY=sk-or-v1-secret\n');
    expect(h.out).toEqual([
      'name: event-rsvp-app',
      'limit: 3 USD',
      'usage: 0 USD',
      'action: created',
      'OPENROUTER_API_KEY written to .env.local',
    ]);
    expect(h.err).toEqual([]);
    expect(h.printed()).not.toContain('sk-or-v1-secret');
    expect(h.printed()).not.toContain('mgmt-secret');
  });

  it('REQ-98: without the management key it exits 2 before any request', async () => {
    const h = harness([], {}, {});
    await expect(h.run()).resolves.toBe(2);
    expect(h.err).toEqual([
      'OPENROUTER_MANAGMENT_KEY is not set — ask the human to set it as a system environment variable.',
    ]);
    expect(h.http.calls.length).toBe(0);

    const h2 = harness(
      [{ method: 'GET', url: LIST(0), status: 200, body: { data: [] } }, CREATE('event-rsvp-app')],
      {},
      { OPENROUTER_MANAGEMENT_KEY: 'mgmt-secret' },
    );
    await expect(h2.run()).resolves.toBe(0);
  });

  it('REQ-98: reuses the key already in the env file without writing it', async () => {
    const h = harness(
      [
        { method: 'GET', url: LIST(0), status: 200, body: { data: [apiKey('event-rsvp-app')] } },
        { method: 'GET', url: LIST(1), status: 200, body: { data: [] } },
      ],
      { '.env.local': 'OPENROUTER_API_KEY=sk-or-v1-old\n' },
    );
    await expect(h.run()).resolves.toBe(0);
    expect(h.writeFile).not.toHaveBeenCalled();
    expect(h.out).toEqual([
      'name: event-rsvp-app',
      'limit: 3 USD',
      'usage: 0.12 USD',
      'action: reused',
    ]);
    expect(h.printed()).not.toContain('sk-or-v1-old');
  });

  it('REQ-98: --limit, --name and --env-file are honored and --limit is validated', async () => {
    const h = harness([]);
    await expect(h.run(['--limit', '0'])).resolves.toBe(2);
    await expect(h.run(['--limit', 'abc'])).resolves.toBe(2);
    expect(h.err).toEqual([
      '--limit must be a positive number of USD',
      '--limit must be a positive number of USD',
    ]);

    const h2 = harness([
      { method: 'GET', url: LIST(0), status: 200, body: { data: [] } },
      CREATE('event-rsvp-app-prod', { limit: 2.5 }),
    ]);
    await expect(
      h2.run([
        '--limit',
        '2.5',
        '--name',
        'event-rsvp-app-prod',
        '--env-file',
        '.env.vercel.local',
      ]),
    ).resolves.toBe(0);
    expect(JSON.parse(h2.http.calls[1].init.body as string)).toEqual({
      name: 'event-rsvp-app-prod',
      limit: 2.5,
    });
    expect(h2.store.get('.env.vercel.local')).toBe('OPENROUTER_API_KEY=sk-or-v1-secret\n');
    expect(h2.out[1]).toBe('limit: 2.5 USD');
  });

  it('REQ-98: failures exit 1 with a message that has no secret', async () => {
    const h = harness([
      {
        method: 'GET',
        url: LIST(0),
        status: 401,
        body: { error: { code: 401, message: 'invalid key mgmt-secret' } },
      },
    ]);
    await expect(h.run()).resolves.toBe(1);
    expect(h.err).toEqual(['OpenRouter keys API GET /keys failed: HTTP 401']);
    expect(h.out).toEqual([]);

    const h2 = harness(
      [
        { method: 'GET', url: LIST(0), status: 200, body: { data: [apiKey('event-rsvp-app')] } },
        { method: 'GET', url: LIST(1), status: 200, body: { data: [] } },
      ],
      {},
    );
    await expect(h2.run()).resolves.toBe(1);
    expect(h2.err).toEqual([
      'Key "event-rsvp-app" exists but OPENROUTER_API_KEY is not in the env file — re-run with --rotate to replace it.',
    ]);
  });
});
