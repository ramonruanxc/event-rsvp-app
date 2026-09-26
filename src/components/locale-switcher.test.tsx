// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent } from '@testing-library/react';
import { renderWithIntl } from '@/test/render';
import { LOCALE_REFOCUS_KEY, LocaleSwitcher } from './locale-switcher';

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

describe('LocaleSwitcher keyboard (REQ-144)', () => {
  beforeEach(() => {
    nav.replace.mockClear();
    sessionStorage.clear();
  });

  it('REQ-144: arrow keys move the selection without changing the page; Enter commits it', () => {
    const { getByLabelText } = renderWithIntl(<LocaleSwitcher />);
    const select = getByLabelText('Language') as HTMLSelectElement;

    fireEvent.keyDown(select, { key: 'ArrowDown' });
    fireEvent.change(select, { target: { value: 'fr' } });
    fireEvent.keyUp(select, { key: 'ArrowDown' });
    fireEvent.keyDown(select, { key: 'ArrowDown' });
    fireEvent.change(select, { target: { value: 'pt-BR' } });
    fireEvent.keyUp(select, { key: 'ArrowDown' });

    expect(nav.replace).not.toHaveBeenCalled();
    expect(select.value).toBe('pt-BR');

    fireEvent.keyDown(select, { key: 'Enter' });

    expect(nav.replace).toHaveBeenCalledTimes(1);
    expect(nav.replace).toHaveBeenCalledWith('/e/abc', { locale: 'pt-BR' });
    expect(sessionStorage.getItem(LOCALE_REFOCUS_KEY)).toBe('1');
  });

  it('REQ-144: leaving the select with a new value commits it once; the same value commits nothing', () => {
    const { getByLabelText } = renderWithIntl(<LocaleSwitcher />);
    const select = getByLabelText('Language') as HTMLSelectElement;

    fireEvent.blur(select);
    expect(nav.replace).not.toHaveBeenCalled();

    fireEvent.keyDown(select, { key: 'ArrowDown' });
    fireEvent.change(select, { target: { value: 'fr' } });
    fireEvent.keyUp(select, { key: 'ArrowDown' });
    expect(nav.replace).not.toHaveBeenCalled();
    fireEvent.blur(select);
    fireEvent.keyDown(select, { key: 'Enter' });

    expect(nav.replace).toHaveBeenCalledTimes(1);
    expect(nav.replace).toHaveBeenCalledWith('/e/abc', { locale: 'fr' });
  });

  it('REQ-144: after a locale change the select takes focus back', () => {
    sessionStorage.setItem(LOCALE_REFOCUS_KEY, '1');

    const { getByLabelText } = renderWithIntl(<LocaleSwitcher />);

    expect(document.activeElement).toBe(getByLabelText('Language'));
    expect(sessionStorage.getItem(LOCALE_REFOCUS_KEY)).toBeNull();
  });
});
