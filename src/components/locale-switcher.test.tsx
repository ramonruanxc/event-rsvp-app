// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { fireEvent } from '@testing-library/react';
import { renderWithIntl } from '@/test/render';
import { LocaleSwitcher } from './locale-switcher';

const nav = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn(), replace: vi.fn() }));
vi.mock('@/i18n/navigation', () => ({ useRouter: () => nav, usePathname: () => '/e/abc' }));

describe('LocaleSwitcher', () => {
  it('REQ-80: the language select is named by aria-label and has a decorative globe', () => {
    const { getByLabelText, container } = renderWithIntl(<LocaleSwitcher />);
    const select = getByLabelText('Language');
    expect(select.tagName).toBe('SELECT');
    expect((select as HTMLSelectElement).value).toBe('en');
    expect(select.getAttribute('aria-label')).toBe('Language');
    expect(container.querySelector('label')).toBeNull();

    const hiddenSvgs = container.querySelectorAll('svg[aria-hidden="true"]');
    expect(hiddenSvgs.length).toBe(2);
    expect(container.querySelector('svg.lucide-globe')).not.toBeNull();
  });

  it('REQ-80: choosing French keeps the page', () => {
    const { getByLabelText } = renderWithIntl(<LocaleSwitcher />);
    fireEvent.change(getByLabelText('Language'), { target: { value: 'fr' } });
    expect(nav.replace).toHaveBeenCalledWith('/e/abc', { locale: 'fr' });
  });
});
