// @vitest-environment jsdom
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { renderWithIntl } from '@/test/render';
import { GuestRsvpPanel } from './guest-rsvp-panel';

const nav = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn(), replace: vi.fn() }));
vi.mock('@/i18n/navigation', () => ({ useRouter: () => nav, usePathname: () => '/' }));

describe('GuestRsvpPanel', () => {
  test('REQ-31: a returning guest who is going sees "You\'re going (3)" with Change and Cancel', () => {
    renderWithIntl(
      <GuestRsvpPanel
        ownRsvp={{ name: 'Maria', status: 'GOING', partySize: 3 }}
        ended={false}
        submit={vi.fn()}
        cancel={vi.fn()}
      />,
    );

    expect(screen.getByText("You're going (3)")).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Change' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeTruthy();
  });

  test('REQ-31: a guest who is not going sees "You\'re not going" and only Change', () => {
    renderWithIntl(
      <GuestRsvpPanel
        ownRsvp={{ name: 'Maria', status: 'NOT_GOING', partySize: 0 }}
        ended={false}
        submit={vi.fn()}
        cancel={vi.fn()}
      />,
    );

    expect(screen.getByText("You're not going")).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Change' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Cancel' })).toBeNull();
  });

  test('REQ-31: Change opens the form prefilled', () => {
    renderWithIntl(
      <GuestRsvpPanel
        ownRsvp={{ name: 'Maria', status: 'GOING', partySize: 3 }}
        ended={false}
        submit={vi.fn()}
        cancel={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Change' }));

    expect((screen.getByLabelText('Your name') as HTMLInputElement).value).toBe('Maria');
  });

  test('REQ-31: Cancel calls the cancel action', async () => {
    const cancel = vi.fn().mockResolvedValue({
      ok: true,
      data: { name: 'Maria', status: 'NOT_GOING', partySize: 0 },
    });
    renderWithIntl(
      <GuestRsvpPanel
        ownRsvp={{ name: 'Maria', status: 'GOING', partySize: 3 }}
        ended={false}
        submit={vi.fn()}
        cancel={cancel}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(cancel).toHaveBeenCalledTimes(1));
  });

  test('REQ-31: an ended event shows the notice, the own status without buttons, and no form', () => {
    renderWithIntl(
      <GuestRsvpPanel
        ownRsvp={{ name: 'Maria', status: 'GOING', partySize: 3 }}
        ended={true}
        submit={vi.fn()}
        cancel={vi.fn()}
      />,
    );

    expect(screen.getByText('This event has ended')).toBeTruthy();
    expect(screen.getByText("You're going (3)")).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Change' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Cancel' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Send RSVP' })).toBeNull();
  });
});
