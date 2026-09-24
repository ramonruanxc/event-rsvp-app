import { describe, expect, it } from 'vitest';
import { toNameKey } from './name-key';

describe('toNameKey', () => {
  it('REQ-21: trims and lower-cases the name', () => {
    expect(toNameKey('  Maria ')).toBe('maria');
    expect(toNameKey('MARIA')).toBe('maria');
  });

  it('REQ-21: composed and decomposed accents give the same key', () => {
    const composed = 'José'; // é as one code point (NFC)
    const decomposed = 'José'; // e + combining acute accent (NFD)
    expect(toNameKey(composed)).toBe(toNameKey(decomposed));
  });

  it('REQ-21: keeps inner spaces', () => {
    expect(toNameKey('Mary Ann')).toBe('mary ann');
  });
});
