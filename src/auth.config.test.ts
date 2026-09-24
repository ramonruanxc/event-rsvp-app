import { describe, expect, it } from 'vitest';
import { authConfig } from './auth.config';

describe('authConfig', () => {
  it('REQ-01: Google is the only provider and sessions are stored in the database', () => {
    const providers = authConfig.providers;
    expect(providers).toHaveLength(1);
    const p = providers[0];
    const resolved =
      typeof p === 'function' ? (p as (o: object) => { id: string })({}) : (p as { id: string });
    expect(resolved.id).toBe('google');
    expect(authConfig.session?.strategy).toBe('database');
  });
});
