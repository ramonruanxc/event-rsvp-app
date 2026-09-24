// @vitest-environment jsdom
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { renderWithIntl } from '@/test/render';
import { DeleteEventButton } from './delete-event-button';

const nav = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn(), replace: vi.fn() }));
vi.mock('@/i18n/navigation', () => ({ useRouter: () => nav, usePathname: () => '/' }));

describe('DeleteEventButton', () => {
  test('REQ-19: cancelling the confirmation does not delete', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const deleteAction = vi.fn();
    renderWithIntl(<DeleteEventButton deleteAction={deleteAction} />);

    fireEvent.click(screen.getByRole('button', { name: 'Delete event' }));

    expect(window.confirm).toHaveBeenCalledWith(
      'Delete this event and all its RSVPs? This cannot be undone.',
    );
    expect(deleteAction).not.toHaveBeenCalled();
  });

  test('REQ-19: confirming deletes and goes to the dashboard', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const deleteAction = vi.fn().mockResolvedValue({ ok: true, data: null });
    renderWithIntl(<DeleteEventButton deleteAction={deleteAction} />);

    fireEvent.click(screen.getByRole('button', { name: 'Delete event' }));

    await waitFor(() => expect(deleteAction).toHaveBeenCalledTimes(1));
    expect(nav.push).toHaveBeenCalledWith('/dashboard');
  });
});
