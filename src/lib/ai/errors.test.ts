import { describe, expect, it } from 'vitest';
import { outageReasonForStatus } from './errors';
import type { OutageReason } from './errors';

describe('outageReasonForStatus', () => {
  it('REQ-88: outage HTTP statuses map to a reason', () => {
    const cases: [number, OutageReason][] = [
      [401, 'auth'],
      [403, 'auth'],
      [402, 'credit'],
      [408, 'timeout'],
      [429, 'rate-limit'],
      [500, 'server'],
      [502, 'server'],
      [503, 'server'],
      [504, 'server'],
      [529, 'server'],
      [599, 'server'],
    ];
    for (const [status, reason] of cases) {
      expect(outageReasonForStatus(status)).toBe(reason);
    }
  });

  it('REQ-88: other statuses are not outages', () => {
    for (const status of [200, 400, 404, 413, 422, 600]) {
      expect(outageReasonForStatus(status)).toBeNull();
    }
  });
});
