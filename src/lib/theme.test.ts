import { describe, expect, it } from 'vitest';
import { nextTheme, parseTheme, themeCookieString } from './theme';

describe('theme', () => {
  it('REQ-62: anything but "light" is the dark theme', () => {
    expect(parseTheme(undefined)).toBe('dark');
    expect(parseTheme(null)).toBe('dark');
    expect(parseTheme('')).toBe('dark');
    expect(parseTheme('purple')).toBe('dark');
    expect(parseTheme('LIGHT')).toBe('dark');
    expect(parseTheme('dark')).toBe('dark');
    expect(parseTheme('light')).toBe('light');
  });

  it('REQ-62: nextTheme flips the theme', () => {
    expect(nextTheme('dark')).toBe('light');
    expect(nextTheme('light')).toBe('dark');
  });

  it('REQ-62: the cookie keeps the theme for a year on the whole site', () => {
    expect(themeCookieString('light')).toBe('theme=light; Path=/; Max-Age=31536000; SameSite=Lax');
  });
});
