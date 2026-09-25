// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { fireEvent } from '@testing-library/react';
import { renderWithIntl } from '@/test/render';
import { ThemeToggle } from './theme-toggle';

afterEach(() => {
  document.cookie = 'theme=; Path=/; Max-Age=0';
  delete document.documentElement.dataset.theme;
});

describe('ThemeToggle', () => {
  it('REQ-64: in the dark theme the toggle is a pressed "Dark theme" button with a moon', () => {
    const { getByRole } = renderWithIntl(<ThemeToggle initialTheme="dark" />);
    const button = getByRole('button', { name: 'Dark theme' });
    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(button.querySelector('svg.lucide-moon')).not.toBeNull();
  });

  it('REQ-64: pressing it switches to light at once and stores the choice', () => {
    const { getByRole } = renderWithIntl(<ThemeToggle initialTheme="dark" />);
    const button = getByRole('button', { name: 'Dark theme' });

    fireEvent.click(button);
    expect(button.getAttribute('aria-pressed')).toBe('false');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(document.cookie).toContain('theme=light');
    expect(button.querySelector('svg.lucide-sun')).not.toBeNull();

    fireEvent.click(button);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(document.cookie).toContain('theme=dark');
  });
});
