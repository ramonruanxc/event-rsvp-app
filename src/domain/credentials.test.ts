import { describe, expect, it } from 'vitest';
import { normalizeEmail, passwordLength } from './credentials';

describe('credentials (REQ-115)', () => {
  it('REQ-115: normalizeEmail trims and lower-cases', () => {
    expect(normalizeEmail('  Ana@Example.COM ')).toBe('ana@example.com');
  });

  it('REQ-115: passwordLength counts code points', () => {
    expect(passwordLength('12345678')).toBe(8);
    expect(passwordLength('😀'.repeat(100))).toBe(100);
  });
});
