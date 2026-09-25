import { describe, expect, it } from 'vitest';
import { userInitial } from './user-initial';

describe('userInitial', () => {
  it('REQ-80: the avatar initial comes from the name, then the email', () => {
    expect(userInitial('ana', null)).toBe('A');
    expect(userInitial(null, 'zoe@example.com')).toBe('Z');
    expect(userInitial('  élise ', null)).toBe('É');
    expect(userInitial(null, null)).toBe('?');
    expect(userInitial('', '')).toBe('?');
  });
});
