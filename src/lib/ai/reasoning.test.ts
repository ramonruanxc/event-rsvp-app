import { describe, expect, it } from 'vitest';
import { REASONING_EFFORT_SETTINGS, resolveReasoningEffort } from './reasoning';

describe('resolveReasoningEffort (REQ-99)', () => {
  it('REQ-99: every OpenRouter effort and omit are accepted, trimmed and lower-cased', () => {
    expect(REASONING_EFFORT_SETTINGS).toEqual([
      'max',
      'xhigh',
      'high',
      'medium',
      'low',
      'minimal',
      'none',
      'omit',
    ]);
    for (const setting of REASONING_EFFORT_SETTINGS) {
      expect(resolveReasoningEffort(setting)).toBe(setting);
      expect(resolveReasoningEffort(`  ${setting.toUpperCase()} `)).toBe(setting);
    }
  });

  it('REQ-99: unset, blank or unknown values mean low', () => {
    for (const value of [undefined, '', '   ', 'turbo', 'off', 'lowest']) {
      expect(resolveReasoningEffort(value)).toBe('low');
    }
  });
});
