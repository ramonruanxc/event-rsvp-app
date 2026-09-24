import { describe, expect, it } from 'vitest';
import type { ParsedReq } from './parse';
import { checkDiagrams, checkRequirements } from './check';

describe('checkDiagrams', () => {
  it('REQ-90: checkDiagrams reports missing and stale SVGs', () => {
    const result = checkDiagrams([
      { mmd: 'docs/diagrams/a.mmd', mmdTime: 100, svgTime: null },
      { mmd: 'docs/diagrams/b.mmd', mmdTime: 200, svgTime: 150 },
      { mmd: 'docs/diagrams/c.mmd', mmdTime: 300, svgTime: 300 },
    ]);

    expect(result).toEqual([
      'docs/diagrams/a.svg is missing',
      'docs/diagrams/b.svg is older than docs/diagrams/b.mmd — regenerate it',
    ]);
  });
});

describe('checkRequirements', () => {
  it('REQ-90: a done REQ without citing test is reported', () => {
    const reqs: ParsedReq[] = [
      { id: 'REQ-12', rules: ['BR-01'], tooling: false, status: 'done' },
      { id: 'REQ-13', rules: ['BR-01'], tooling: false, status: 'todo' },
    ];

    const result = checkRequirements({
      brs: { ids: new Set(['BR-01']), deprecated: new Set() },
      reqs,
      citations: new Map(),
    });

    expect(result).toEqual(['REQ-12 is done but no test cites it']);
  });

  it('REQ-90: a test citing an unknown REQ is reported', () => {
    const result = checkRequirements({
      brs: { ids: new Set(), deprecated: new Set() },
      reqs: [],
      citations: new Map([['REQ-99', ['e2e/rsvp.spec.ts']]]),
    });

    expect(result).toEqual(['e2e/rsvp.spec.ts cites REQ-99, which does not exist in docs/spec.md']);
  });

  it('REQ-90: a REQ citing an unknown BR is reported', () => {
    const result = checkRequirements({
      brs: { ids: new Set(), deprecated: new Set() },
      reqs: [{ id: 'REQ-12', rules: ['BR-99'], tooling: false, status: 'todo' }],
      citations: new Map(),
    });

    expect(result).toEqual(['REQ-12 cites BR-99, which does not exist in docs/business-rules.md']);
  });

  it('REQ-90: a REQ citing a deprecated BR is reported', () => {
    const result = checkRequirements({
      brs: { ids: new Set(['BR-07']), deprecated: new Set(['BR-07']) },
      reqs: [{ id: 'REQ-12', rules: ['BR-07'], tooling: false, status: 'todo' }],
      citations: new Map(),
    });

    expect(result).toEqual(['REQ-12 cites deprecated BR-07']);
  });

  it('REQ-90: a non-tooling REQ without rules is reported', () => {
    const result = checkRequirements({
      brs: { ids: new Set(), deprecated: new Set() },
      reqs: [{ id: 'REQ-12', rules: [], tooling: false, status: 'todo' }],
      citations: new Map(),
    });

    expect(result).toEqual([
      'REQ-12 has no business rule (use "none (tooling)" for tooling requirements)',
    ]);
  });

  it('REQ-90: a consistent set reports nothing', () => {
    const result = checkRequirements({
      brs: { ids: new Set(['BR-01']), deprecated: new Set() },
      reqs: [{ id: 'REQ-12', rules: ['BR-01'], tooling: false, status: 'done' }],
      citations: new Map([['REQ-12', ['a.test.ts']]]),
    });

    expect(result).toEqual([]);
  });
});
