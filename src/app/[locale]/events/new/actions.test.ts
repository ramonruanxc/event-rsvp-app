import { describe, expect, test, vi } from 'vitest';
import { ValidationError } from '@/domain/errors';

const mocks = vi.hoisted(() => ({ userId: null as string | null, execute: vi.fn() }));
vi.mock('@/lib/session', () => ({ getCurrentUserId: async () => mocks.userId }));
vi.mock('@/lib/container', () => ({ getServices: () => ({ createEvent: { execute: mocks.execute } }) }));

import { createEventAction } from './actions';

describe('createEventAction', () => {
  test('REQ-15: createEventAction refuses without a session', async () => {
    mocks.userId = null;

    const result = await createEventAction({});

    expect(result).toEqual({ ok: false, code: 'UNAUTHENTICATED' });
    expect(mocks.execute).not.toHaveBeenCalled();
  });

  test("REQ-15: createEventAction returns the service's field errors", async () => {
    mocks.userId = 'u1';
    mocks.execute.mockRejectedValueOnce(new ValidationError({ name: 'required' }));

    const result = await createEventAction({});

    expect(result).toEqual({
      ok: false,
      code: 'VALIDATION_ERROR',
      fieldErrors: { name: 'required' },
    });
  });

  test('REQ-15: createEventAction returns the new slug', async () => {
    mocks.userId = 'u1';
    mocks.execute.mockResolvedValueOnce({ slug: 'abcdefghij' });

    const result = await createEventAction({});

    expect(result).toEqual({ ok: true, data: { slug: 'abcdefghij' } });
  });
});
