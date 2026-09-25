import { describe, expect, it } from 'vitest';
import { fakeHttp } from './fake-http';
import { createKeysApi, KeysApiError, type KeyInfo } from './keys-api';

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
/** The same key as KeyInfo. */
const info = (name: string, extra: Partial<KeyInfo> = {}): KeyInfo => ({
  hash: `h-${name}`,
  name,
  limit: 3,
  usage: 0.12,
  disabled: false,
  ...extra,
});

describe('OpenRouter keys API — list (REQ-98)', () => {
  it('REQ-98: lists every key across pages with the management key', async () => {
    const http = fakeHttp([
      { method: 'GET', url: LIST(0), status: 200, body: { data: [apiKey('a'), apiKey('b')] } },
      { method: 'GET', url: LIST(2), status: 200, body: { data: [apiKey('event-rsvp-app')] } },
      { method: 'GET', url: LIST(3), status: 200, body: { data: [] } },
    ]);
    const api = createKeysApi({ fetch: http.fetch, managementKey: 'mgmt-secret' });
    await expect(api.list()).resolves.toEqual([info('a'), info('b'), info('event-rsvp-app')]);
    expect(http.calls.length).toBe(3);
    for (const call of http.calls) {
      expect(call.init.headers.Authorization).toBe('Bearer mgmt-secret');
    }
  });

  it('REQ-98: a failed call raises KeysApiError without the response body', async () => {
    const http = fakeHttp([
      {
        method: 'GET',
        url: LIST(0),
        status: 401,
        body: { error: { code: 401, message: 'invalid key mgmt-secret' } },
      },
    ]);
    const api = createKeysApi({ fetch: http.fetch, managementKey: 'mgmt-secret' });
    await expect(api.list()).rejects.toThrow(KeysApiError);
    await expect(api.list()).rejects.toThrow('OpenRouter keys API GET /keys failed: HTTP 401');
  });
});

describe('OpenRouter keys API — create, update, remove (REQ-98)', () => {
  it('REQ-98: create sends the name and spend limit and returns the new key', async () => {
    const http = fakeHttp([
      {
        method: 'POST',
        url: `${BASE}/keys`,
        status: 201,
        body: { data: apiKey('event-rsvp-app', { usage: 0 }), key: 'sk-or-v1-secret' },
      },
    ]);
    const api = createKeysApi({ fetch: http.fetch, managementKey: 'mgmt-secret' });
    await expect(api.create({ name: 'event-rsvp-app', limit: 3 })).resolves.toEqual({
      info: info('event-rsvp-app', { usage: 0 }),
      key: 'sk-or-v1-secret',
    });
    expect(JSON.parse(http.calls[0].init.body as string)).toEqual({
      name: 'event-rsvp-app',
      limit: 3,
    });
  });

  it('REQ-98: update changes the spend limit', async () => {
    const http = fakeHttp([
      {
        method: 'PATCH',
        url: `${BASE}/keys/h-event-rsvp-app`,
        status: 200,
        body: { data: apiKey('event-rsvp-app', { limit: 5 }) },
      },
    ]);
    const api = createKeysApi({ fetch: http.fetch, managementKey: 'mgmt-secret' });
    await expect(api.update('h-event-rsvp-app', { limit: 5 })).resolves.toEqual(
      info('event-rsvp-app', { limit: 5 }),
    );
    expect(JSON.parse(http.calls[0].init.body as string)).toEqual({ limit: 5 });
  });

  it('REQ-98: remove deletes the key by hash', async () => {
    const http = fakeHttp([
      {
        method: 'DELETE',
        url: `${BASE}/keys/h-event-rsvp-app`,
        status: 200,
        body: { deleted: true },
      },
    ]);
    const api = createKeysApi({ fetch: http.fetch, managementKey: 'mgmt-secret' });
    await expect(api.remove('h-event-rsvp-app')).resolves.toBeUndefined();
    expect(http.calls[0].init.body).toBeUndefined();
  });

  it('REQ-98: a refused creation raises KeysApiError', async () => {
    const http = fakeHttp([{ method: 'POST', url: `${BASE}/keys`, status: 402, body: {} }]);
    const api = createKeysApi({ fetch: http.fetch, managementKey: 'mgmt-secret' });
    await expect(api.create({ name: 'event-rsvp-app', limit: 3 })).rejects.toThrow(
      'OpenRouter keys API POST /keys failed: HTTP 402',
    );
  });
});
