import { describe, expect, it } from 'vitest';
import { checkDiagrams } from './check';

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
