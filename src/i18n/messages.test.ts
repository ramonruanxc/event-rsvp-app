import { describe, expect, it } from 'vitest';
import en from '../../messages/en.json';
import fr from '../../messages/fr.json';
import ptBR from '../../messages/pt-BR.json';
import { flattenKeys } from './flatten-keys';
import { routing } from './routing';

const locales: Array<{ locale: string; messages: Record<string, unknown> }> = [
  { locale: 'fr', messages: fr },
  { locale: 'pt-BR', messages: ptBR },
];

function walkValues(value: unknown): unknown[] {
  if (value !== null && typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).flatMap(walkValues);
  }
  return [value];
}

describe('flattenKeys', () => {
  it('REQ-52: flattenKeys lists sorted dotted leaf keys', () => {
    expect(flattenKeys({ d: 'z', a: { c: 'y', b: 'x' } })).toEqual(['a.b', 'a.c', 'd']);
  });
});

describe('routing', () => {
  it('REQ-52: routing has en, fr and pt-BR with en as default', () => {
    expect(routing.locales).toEqual(['en', 'fr', 'pt-BR']);
    expect(routing.defaultLocale).toBe('en');
  });
});

describe('message catalogs', () => {
  const enKeys = flattenKeys(en);

  it.each(locales)('REQ-52: $locale has exactly the keys of en', ({ locale, messages }) => {
    const localeKeys = flattenKeys(messages);
    const missing = enKeys.filter((key) => !localeKeys.includes(key));
    const extra = localeKeys.filter((key) => !enKeys.includes(key));
    expect({ locale, missing, extra }).toEqual({ locale, missing: [], extra: [] });
  });

  it('REQ-52: no message is empty', () => {
    for (const messages of [en, fr, ptBR]) {
      for (const value of walkValues(messages)) {
        expect(typeof value).toBe('string');
        expect(value).not.toBe('');
      }
    }
  });
});
