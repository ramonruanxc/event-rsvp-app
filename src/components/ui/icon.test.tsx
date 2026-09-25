// @vitest-environment jsdom
import { Check, Sun } from 'lucide-react';
import { describe, expect, it } from 'vitest';
import { renderWithIntl } from '@/test/render';
import { Icon } from './icon';

describe('Icon', () => {
  it('REQ-78: Icon renders a 16 px svg hidden from assistive technology', () => {
    const { container } = renderWithIntl(<Icon icon={Check} />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
    expect(svg?.getAttribute('focusable')).toBe('false');
    expect(svg?.getAttribute('width')).toBe('16');
    expect(svg?.getAttribute('stroke-width')).toBe('1.75');
    expect(svg?.classList.contains('i')).toBe(true);
    expect(svg?.classList.contains('lucide-check')).toBe(true);
  });

  it('REQ-78: Icon size 20 adds the i-20 class and keeps extra classes', () => {
    const { container } = renderWithIntl(<Icon icon={Sun} size={20} className="extra" />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('20');
    expect(svg?.classList.contains('i')).toBe(true);
    expect(svg?.classList.contains('i-20')).toBe(true);
    expect(svg?.classList.contains('extra')).toBe(true);
  });
});
