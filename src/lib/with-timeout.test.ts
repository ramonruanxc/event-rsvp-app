import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TimeoutError, withTimeout } from './with-timeout';

describe('withTimeout', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('REQ-47: rejects with TimeoutError once the time is up', async () => {
    const p = withTimeout(new Promise<never>(() => {}), 10_000);
    let settled = false;
    p.catch(() => {}).finally(() => {
      settled = true;
    });

    await vi.advanceTimersByTimeAsync(9_999);
    expect(settled).toBe(false);

    await vi.advanceTimersByTimeAsync(1);
    await expect(p).rejects.toBeInstanceOf(TimeoutError);
  });

  it('REQ-47: resolves with the value when in time', async () => {
    await expect(withTimeout(Promise.resolve(42), 10_000)).resolves.toBe(42);
  });
});
