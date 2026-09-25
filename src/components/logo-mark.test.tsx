// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { renderWithIntl } from '@/test/render';
import { LogoMark } from './logo-mark';

describe('LogoMark', () => {
  it('REQ-75: the logo mark is a decorative indigo calendar with a turquoise check', () => {
    const { container } = renderWithIntl(<LogoMark />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
    expect(svg?.hasAttribute('data-logo-mark')).toBe(true);
    expect(svg?.getAttribute('viewBox')).toBe('0 0 24 24');
    expect(svg?.getAttribute('width')).toBe('24');
    expect(svg?.querySelector('rect')?.getAttribute('fill')).toBe('#3630B0');
    expect(svg?.querySelector('path')?.getAttribute('stroke')).toBe('#3BDBD1');
  });
});
