import { describe, expect, it } from 'vitest';
import { parseBusinessRules, parseRequirements } from './parse';

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

describe('parseRequirements', () => {
  it('REQ-90: parseRequirements reads id, rules, tooling flag and status', () => {
    const markdown = [
      '### REQ-01 — A',
      '**Rules:** BR-01, BR-95',
      '**Status:** done',
      '',
      '### DOC-Q1 — not a requirement',
      '',
      '### Identity & access',
      '',
      '### REQ-90 — B',
      '**Rules:** none (tooling)',
      '**Status:** todo',
      '',
      '### REQ-02 — C',
      '**Rules:** ',
      '**Status:** todo',
    ].join('\n');

    const result = parseRequirements(markdown);

    expect(result).toEqual([
      { id: 'REQ-01', rules: ['BR-01', 'BR-95'], tooling: false, status: 'done' },
      { id: 'REQ-90', rules: [], tooling: true, status: 'todo' },
      { id: 'REQ-02', rules: [], tooling: false, status: 'todo' },
    ]);
  });
});
