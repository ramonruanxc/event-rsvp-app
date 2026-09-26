// @vitest-environment jsdom
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { renderWithIntl } from '@/test/render';
import { DeleteEventButton } from './delete-event-button';

const nav = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn(), replace: vi.fn() }));
vi.mock('@/i18n/navigation', () => ({ useRouter: () => nav, usePathname: () => '/' }));

describe('DeleteEventButton', () => {
  test('REQ-19: the confirmation is inline and Keep does not delete', () => {
    const confirmSpy = vi.spyOn(window, 'confirm');
    const deleteAction = vi.fn();
    renderWithIntl(<DeleteEventButton deleteAction={deleteAction} />);

    fireEvent.click(screen.getByRole('button', { name: 'Delete event' }));

    expect(
      screen.getByRole('group', {
        name: 'Delete this event and all its RSVPs? This cannot be undone.',
      }),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Keep' }));

    expect(deleteAction).not.toHaveBeenCalled();
    expect(confirmSpy).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Delete event' })).toBeTruthy();
  });

  test('REQ-19: confirming deletes and goes to the dashboard', async () => {
    const deleteAction = vi.fn().mockResolvedValue({ ok: true, data: null });
    renderWithIntl(<DeleteEventButton deleteAction={deleteAction} />);

    fireEvent.click(screen.getByRole('button', { name: 'Delete event' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(deleteAction).toHaveBeenCalledTimes(1));
    expect(nav.push).toHaveBeenCalledWith('/dashboard');
  });

  test('REQ-142: a failed delete says why and stays on the page', async () => {
    nav.push.mockClear();
    const deleteAction = vi.fn().mockResolvedValue({ ok: false, code: 'NOT_OWNER' });
    renderWithIntl(<DeleteEventButton deleteAction={deleteAction} />);

    fireEvent.click(screen.getByRole('button', { name: 'Delete event' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    expect((await screen.findByRole('alert')).textContent).toBe('Only the organizer can do this.');
    expect(nav.push).not.toHaveBeenCalled();
    expect(screen.getByRole('group')).toBeTruthy();
  });
});
