/** The two supported color themes. */
export type Theme = 'dark' | 'light';

/** Name of the cookie that stores the user's theme choice. */
export const THEME_COOKIE = 'theme';

/** Theme rendered when no cookie is present (BR-97). */
export const DEFAULT_THEME: Theme = 'dark';

/** Parses a cookie value into a Theme; anything but exactly 'light' is dark. */
export function parseTheme(value: string | null | undefined): Theme {
  return value === 'light' ? 'light' : 'dark';
}

/** Returns the other theme. */
export function nextTheme(theme: Theme): Theme {
  return theme === 'dark' ? 'light' : 'dark';
}

/** Builds the Set-Cookie value that stores the theme for a year on the whole site. */
export function themeCookieString(theme: Theme): string {
  return `${THEME_COOKIE}=${theme}; Path=/; Max-Age=31536000; SameSite=Lax`;
}
