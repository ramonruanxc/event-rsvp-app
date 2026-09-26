// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { renderWithIntl } from '@/test/render';
import { HeaderSignInLink } from './header-sign-in-link';

const path = vi.hoisted(() => ({ current: '/' }));
vi.mock('@/i18n/navigation', () => ({ usePathname: () => path.current }));

describe('HeaderSignInLink (REQ-146)', () => {
  it('REQ-146: shown on other pages, hidden on the sign-in and register pages', () => {
    const href = '/en/sign-in?callbackUrl=%2Fen%2Fdashboard';
    for (const [pathname, shown] of [
      ['/', true],
      ['/e/abc', true],
      ['/sign-in', false],
      ['/register', false],
    ] as const) {
      path.current = pathname;
      const { queryByRole, unmount } = renderWithIntl(
        <HeaderSignInLink href={href} label="Sign in" />,
      );
      const link = queryByRole('link', { name: 'Sign in' });
      expect(Boolean(link), pathname).toBe(shown);
      if (link) {
        expect(link.getAttribute('href')).toBe(href);
        expect(link.className).toBe('btn btn-secondary btn-sm');
      }
      unmount();
    }
  });
});
