// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, waitFor } from '@testing-library/react';
import type { ActionResult } from '@/lib/action-result';
import { renderWithIntl } from '@/test/render';
import { PasswordNotice } from './password-notice';

const nav = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn(), replace: vi.fn() }));
vi.mock('@/i18n/navigation', () => ({
  useRouter: () => nav,
  usePathname: () => '/',
  Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const TEXT =
  'You signed in with Google, so the password on this account was removed to keep it safe. Set a new password in Account to sign in with your email again.';

describe('PasswordNotice', () => {
  it('REQ-123: explains the cleared password and links to Account', () => {
    const { getByRole } = renderWithIntl(<PasswordNotice dismiss={vi.fn()} />);
    const notice = getByRole('status');
    expect(notice.className).toContain('notice');
    expect(notice.textContent).toContain(TEXT);
    expect(getByRole('link', { name: 'Go to Account' }).getAttribute('href')).toBe('/account');
    expect(getByRole('button', { name: 'Dismiss' })).not.toBeNull();
  });

  it('REQ-123: Dismiss hides the notice and refreshes the page', async () => {
    const dismiss = vi.fn(async (): Promise<ActionResult<null>> => ({ ok: true, data: null }));
    const { getByRole, queryByRole } = renderWithIntl(<PasswordNotice dismiss={dismiss} />);
    fireEvent.click(getByRole('button', { name: 'Dismiss' }));
    await waitFor(() => expect(queryByRole('status')).toBeNull());
    expect(dismiss).toHaveBeenCalledTimes(1);
    expect(nav.refresh).toHaveBeenCalled();
  });

  it('REQ-123: a failed dismissal keeps the notice', async () => {
    const dismiss = vi.fn(async (): Promise<ActionResult<null>> => ({
      ok: false,
      code: 'INTERNAL_ERROR',
    }));
    const { getByRole } = renderWithIntl(<PasswordNotice dismiss={dismiss} />);
    fireEvent.click(getByRole('button', { name: 'Dismiss' }));
    await waitFor(() => expect(dismiss).toHaveBeenCalled());
    expect(getByRole('status')).not.toBeNull();
  });
});
