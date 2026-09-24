import { beforeEach, describe, expect, it } from 'vitest';
import { createEventRow, createUser, resetDatabase } from '@/test/db';
import { GET } from './route';

describe('GET /e/[slug]/calendar.ics', () => {
  beforeEach(resetDatabase);

  it('REQ-42: anyone can download the calendar file', async () => {
    const owner = await createUser();
    const event = await createEventRow(owner.id);

    const res = await GET(new Request('http://localhost/e/x/calendar.ics'), {
      params: Promise.resolve({ slug: event.slug }),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('text/calendar; charset=utf-8');
    expect(res.headers.get('Content-Disposition')).toBe(`attachment; filename="${event.slug}.ics"`);
    const body = await res.text();
    expect(body).toContain('SUMMARY:Team dinner');
  });

  it('REQ-42: unknown slug returns 404', async () => {
    const res = await GET(new Request('http://localhost/e/x/calendar.ics'), {
      params: Promise.resolve({ slug: 'unknown-slug-1' }),
    });

    expect(res.status).toBe(404);
  });
});
