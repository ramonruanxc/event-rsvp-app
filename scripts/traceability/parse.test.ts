import { describe, expect, it } from 'vitest';
import { parseBusinessRules } from './parse';

describe('parseBusinessRules', () => {
  it('REQ-90: parseBusinessRules reads active and deprecated BR headings', () => {
    const markdown = [
      '#### BR-01 — Organizer authentication method',
      'text BR-50 in prose is ignored',
      '#### ~~BR-07~~ Deprecated by BR-19',
      '#### BR-19 — Something',
    ].join('\n');

    const result = parseBusinessRules(markdown);

    expect(result.ids).toEqual(new Set(['BR-01', 'BR-07', 'BR-19']));
    expect(result.deprecated).toEqual(new Set(['BR-07']));
  });
});
