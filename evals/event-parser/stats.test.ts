import { describe, expect, it } from 'vitest';
import { percentile95 } from './stats';

describe('percentile95 (REQ-101)', () => {
  it('REQ-101: percentile95 uses the nearest-rank method', () => {
    expect(percentile95([])).toBe(0);
    expect(percentile95([5])).toBe(5);
    expect(percentile95(Array.from({ length: 20 }, (_, i) => 20 - i))).toBe(19);
    expect(percentile95(Array.from({ length: 100 }, (_, i) => i + 1))).toBe(95);
    const input = [3000, 1000, 2000];
    expect(percentile95(input)).toBe(3000);
    expect(input).toEqual([3000, 1000, 2000]);
  });
});
