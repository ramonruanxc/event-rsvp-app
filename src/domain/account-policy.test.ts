import { describe, expect, it } from 'vitest';
import { passwordSessionValid } from './account-policy';

describe('passwordSessionValid', () => {
  it('REQ-122: a password session opened before the clearing is no longer valid', () => {
    const cleared = { passwordClearedAt: new Date(1_000) };
    expect(passwordSessionValid(undefined, null)).toBe(true);
    expect(passwordSessionValid('1000', cleared)).toBe(true);
    expect(passwordSessionValid(2_000, null)).toBe(false);
    expect(passwordSessionValid(500, { passwordClearedAt: null })).toBe(true);
    expect(passwordSessionValid(999, cleared)).toBe(false);
    expect(passwordSessionValid(1_000, cleared)).toBe(false);
    expect(passwordSessionValid(1_001, cleared)).toBe(true);
  });
});
