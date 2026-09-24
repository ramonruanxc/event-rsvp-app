import { describe, expect, it } from 'vitest';
import { runTraceability } from './cli';

describe('runTraceability', () => {
  it('REQ-90: the repository passes its own traceability check', () => {
    expect(runTraceability(process.cwd())).toEqual([]);
  });
});
