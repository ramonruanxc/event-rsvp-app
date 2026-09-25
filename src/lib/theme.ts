/** The two supported color themes. */
export type Theme = 'dark' | 'light';

/** Name of the cookie that stores the user's theme choice. */
export const THEME_COOKIE = 'theme';

/** Theme rendered when no cookie is present (BR-97). */
export const DEFAULT_THEME: Theme = 'dark';

/** Parses a cookie value into a Theme; anything but exactly 'light' is dark. */
export function parseTheme(_value: string | null | undefined): Theme {
  throw new Error('not implemented');
}

/** Returns the other theme. */
export function nextTheme(_theme: Theme): Theme {
  throw new Error('not implemented');
}

/** Builds the Set-Cookie value that stores the theme for a year on the whole site. */
export function themeCookieString(_theme: Theme): string {
  throw new Error('not implemented');
}
