// @vitest-environment jsdom
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { renderWithIntl } from '@/test/render';
import { RsvpForm } from './rsvp-form';

const nav = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn(), replace: vi.fn() }));
vi.mock('@/i18n/navigation', () => ({ useRouter: () => nav, usePathname: () => '/' }));

/** Fills the name and party size with values that pass client-side validation. */
function fillGoing(name: string, partySize: number) {
  fireEvent.change(screen.getByLabelText('Your name'), { target: { value: name } });
  fireEvent.change(screen.getByLabelText('How many people, including you?'), {
    target: { value: String(partySize) },
  });
}

describe('RsvpForm', () => {
  test('REQ-31: the party size label is "How many people, including you?"', () => {
    renderWithIntl(<RsvpForm submit={vi.fn()} />);

    expect(screen.getByLabelText('How many people, including you?')).toBeTruthy();
  });

  test('REQ-31: party size is hidden when Not going', () => {
    renderWithIntl(<RsvpForm submit={vi.fn()} />);

    fireEvent.click(screen.getByLabelText('Not going'));

    expect(screen.queryByLabelText('How many people, including you?')).toBeNull();
  });

  test('REQ-31: submits the values', async () => {
    const submit = vi.fn().mockResolvedValue({
      ok: true,
      data: { name: 'Maria', status: 'GOING', partySize: 3 },
    });
    renderWithIntl(<RsvpForm submit={submit} />);
    fillGoing('Maria', 3);

    fireEvent.click(screen.getByRole('button', { name: 'Send RSVP' }));

    await waitFor(() =>
      expect(submit).toHaveBeenCalledWith({ name: 'Maria', status: 'GOING', partySize: 3 }, ''),
    );
  });

  test('REQ-26: a duplicate name shows the message and keeps the values', async () => {
    const submit = vi.fn().mockResolvedValue({ ok: false, code: 'DUPLICATE_NAME' });
    renderWithIntl(<RsvpForm submit={submit} />);
    fillGoing('Maria', 3);

    fireEvent.click(screen.getByRole('button', { name: 'Send RSVP' }));

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toBe(
      'This name is already on the list. Use a different name or ask the organizer.',
    );
    expect((screen.getByLabelText('Your name') as HTMLInputElement).value).toBe('Maria');
    expect(
      (screen.getByLabelText('How many people, including you?') as HTMLInputElement).value,
    ).toBe('3');
  });

  test('REQ-57: a rate-limited submission shows the message and keeps the values', async () => {
    const submit = vi.fn().mockResolvedValue({ ok: false, code: 'RATE_LIMITED' });
    renderWithIntl(<RsvpForm submit={submit} />);
    fillGoing('Maria', 3);

    fireEvent.click(screen.getByRole('button', { name: 'Send RSVP' }));

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toBe('Too many submissions — please try again in a few minutes.');
    expect((screen.getByLabelText('Your name') as HTMLInputElement).value).toBe('Maria');
    expect(screen.getByLabelText('Going')).toBeTruthy();
    expect(
      (screen.getByLabelText('How many people, including you?') as HTMLInputElement).value,
    ).toBe('3');
  });
});
