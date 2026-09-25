import { describe, expect, it } from 'vitest';
import { cx } from './cx';

describe('cx', () => {
  it('REQ-78: cx joins the truthy class names', () => {
    expect(cx('a', false, null, undefined, '', 'b')).toBe('a b');
    expect(cx()).toBe('');
  });
});
