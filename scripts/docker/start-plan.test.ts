import { describe, expect, it, vi } from 'vitest';
import { withAuthSecret, type Env } from './start-plan';

describe('withAuthSecret (REQ-109)', () => {
  it('REQ-109: generates AUTH_SECRET when it is missing or blank', () => {
    for (const given of [{}, { AUTH_SECRET: '' }, { AUTH_SECRET: '   ' }]) {
      const input: Env = { ...given, PATH: '/usr/bin' };
      expect(
        withAuthSecret(input, () => 'generated-secret'),
        JSON.stringify(given),
      ).toEqual({
        env: { PATH: '/usr/bin', AUTH_SECRET: 'generated-secret' },
        generated: true,
      });
      expect(input).toEqual({ ...given, PATH: '/usr/bin' });
    }
  });

  it('REQ-109: keeps a supplied AUTH_SECRET and never calls the generator', () => {
    const generate = vi.fn(() => 'generated-secret');
    expect(withAuthSecret({ AUTH_SECRET: 'from-env-local', PATH: '/usr/bin' }, generate)).toEqual({
      env: { AUTH_SECRET: 'from-env-local', PATH: '/usr/bin' },
      generated: false,
    });
    expect(generate).not.toHaveBeenCalled();
  });
});
