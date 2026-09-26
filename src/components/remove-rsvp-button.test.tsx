// @vitest-environment jsdom
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { renderWithIntl } from '@/test/render';
import { RemoveRsvpButton } from './remove-rsvp-button';

const nav = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn(), replace: vi.fn() }));
vi.mock('@/i18n/navigation', () => ({ useRouter: () => nav, usePathname: () => '/' }));

describe('RemoveRsvpButton', () => {
  test('REQ-72: removing Maria asks inline first', async () => {
    const removeAction = vi.fn().mockResolvedValue({ ok: true, data: null });
    renderWithIntl(<RemoveRsvpButton name="Maria" removeAction={removeAction} />);

    fireEvent.click(screen.getByRole('button', { name: 'Remove Maria' }));

    expect(screen.getByRole('group', { name: 'Remove Maria from the guest list?' })).toBeTruthy();
    expect(removeAction).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));

    await waitFor(() => expect(removeAction).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(nav.refresh).toHaveBeenCalledTimes(1));
  });

  test('REQ-142: a failed removal says why and does not refresh', async () => {
    nav.refresh.mockClear();
    const removeAction = vi.fn().mockResolvedValue({ ok: false, code: 'INTERNAL_ERROR' });
    renderWithIntl(<RemoveRsvpButton name="Maria" removeAction={removeAction} />);

    fireEvent.click(screen.getByRole('button', { name: 'Remove Maria' }));
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));

    expect((await screen.findByRole('alert')).textContent).toBe(
      'Something went wrong. Please try again.',
    );
    expect(nav.refresh).not.toHaveBeenCalled();
  });

  test('REQ-140: a successful removal moves focus to the Guest list heading', async () => {
    const removeAction = vi.fn().mockResolvedValue({ ok: true, data: null });
    renderWithIntl(
      <>
        <h2 id="guest-list-heading" tabIndex={-1}>
          Guest list
        </h2>
        <RemoveRsvpButton name="Maria" removeAction={removeAction} />
      </>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Remove Maria' }));
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));

    await waitFor(() =>
      expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Guest list' })),
    );
  });
});
