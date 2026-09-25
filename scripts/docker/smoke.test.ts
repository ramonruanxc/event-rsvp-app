import { describe, expect, it, vi } from 'vitest';
import { DEMO_SLUG } from '@/lib/demo-seed';
import { SMOKE_CHECKS, runSmoke, smokeBaseUrl } from './smoke';

const HTML = 'text/html; charset=utf-8';
const ok = (contentType: string) =>
  new Response('ok', { status: 200, headers: { 'content-type': contentType } });

/** Fake fetch answering by URL path; an Error answer is thrown instead of returned. */
function fakeFetch(byPath: Record<string, Response | Error>) {
  return vi.fn(async (url: string | URL | Request) => {
    const answer = byPath[new URL(String(url)).pathname];
    if (answer instanceof Error) throw answer;
    return answer;
  });
}

describe('smoke check (REQ-113)', () => {
  it('REQ-113: checks the home page, the seeded demo event page and its .ics download', () => {
    expect(SMOKE_CHECKS).toEqual([
      { path: '/en' },
      { path: `/en/e/${DEMO_SLUG}` },
      { path: `/e/${DEMO_SLUG}/calendar.ics`, contentType: 'text/calendar' },
    ]);
  });

  it('REQ-113: passes when every check answers 200 with the expected content type', async () => {
    const fetchMock = fakeFetch({
      '/en': ok(HTML),
      '/en/e/demoPicnic': ok(HTML),
      '/e/demoPicnic/calendar.ics': ok('text/calendar; charset=utf-8'),
    });

    const result = await runSmoke('http://localhost:3100', fetchMock as unknown as typeof fetch);

    expect(result).toEqual({
      ok: true,
      lines: [
        '✓ /en 200',
        '✓ /en/e/demoPicnic 200',
        '✓ /e/demoPicnic/calendar.ics 200 text/calendar',
      ],
    });
    expect(fetchMock.mock.calls).toEqual([
      ['http://localhost:3100/en', { redirect: 'manual' }],
      ['http://localhost:3100/en/e/demoPicnic', { redirect: 'manual' }],
      ['http://localhost:3100/e/demoPicnic/calendar.ics', { redirect: 'manual' }],
    ]);
  });

  it('REQ-113: fails on a wrong status, a network error or a wrong content type', async () => {
    const fetchMock = fakeFetch({
      '/en': new Response(null, { status: 307, headers: { location: '/en/' } }),
      '/en/e/demoPicnic': new TypeError('fetch failed'),
      '/e/demoPicnic/calendar.ics': ok(HTML),
    });

    const result = await runSmoke('http://localhost:3000', fetchMock as unknown as typeof fetch);

    expect(result).toEqual({
      ok: false,
      lines: [
        '✗ /en — expected 200, got 307',
        '✗ /en/e/demoPicnic — request failed: fetch failed',
        '✗ /e/demoPicnic/calendar.ics — expected content-type text/calendar, got text/html; charset=utf-8',
      ],
    });
  });

  it('REQ-113: targets http://localhost:<APP_PORT>, 3000 when APP_PORT is unset or blank', () => {
    expect(smokeBaseUrl({})).toBe('http://localhost:3000');
    expect(smokeBaseUrl({ APP_PORT: ' ' })).toBe('http://localhost:3000');
    expect(smokeBaseUrl({ APP_PORT: '3100' })).toBe('http://localhost:3100');
  });
});
