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
});
