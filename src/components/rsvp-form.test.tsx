// @vitest-environment jsdom
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
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

  test('REQ-58: the form has a hidden honeypot field', () => {
    const { container } = renderWithIntl(<RsvpForm submit={vi.fn()} />);

    const input = container.querySelector('input[name="website"]');
    expect(input).not.toBeNull();
    expect(input!.getAttribute('tabindex')).toBe('-1');
    expect(input!.getAttribute('autocomplete')).toBe('off');
    expect(input!.parentElement?.getAttribute('aria-hidden')).toBe('true');
  });

  test('REQ-58: the honeypot value is sent to the action', async () => {
    const submit = vi.fn().mockResolvedValue({
      ok: true,
      data: { name: 'Maria', status: 'GOING', partySize: 3 },
    });
    const { container } = renderWithIntl(<RsvpForm submit={submit} />);
    fillGoing('Maria', 3);
    fireEvent.change(container.querySelector('input[name="website"]')!, {
      target: { value: 'x' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Send RSVP' }));

    await waitFor(() =>
      expect(submit).toHaveBeenCalledWith({ name: 'Maria', status: 'GOING', partySize: 3 }, 'x'),
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

  test('REQ-58: a rejected honeypot shows a generic form error and keeps the values', async () => {
    const submit = vi.fn().mockResolvedValue({
      ok: false,
      code: 'VALIDATION_ERROR',
      fieldErrors: { form: 'invalidFormat' },
    });
    renderWithIntl(<RsvpForm submit={submit} />);
    fillGoing('Maria', 3);

    fireEvent.click(screen.getByRole('button', { name: 'Send RSVP' }));

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toBe("We couldn't send your RSVP. Please try again.");
    expect(screen.queryByText('Please fix the highlighted fields.')).toBeNull();
    expect(screen.queryByText('This value is not valid.')).toBeNull();
    expect(alert.textContent?.toLowerCase()).not.toContain('website');
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

  test('REQ-69: a form-level rejection is announced with an alert icon', async () => {
    const submit = vi.fn().mockResolvedValue({
      ok: false,
      code: 'VALIDATION_ERROR',
      fieldErrors: { form: 'invalidFormat' },
    });
    renderWithIntl(<RsvpForm submit={submit} />);
    fillGoing('Maria', 3);

    fireEvent.click(screen.getByRole('button', { name: 'Send RSVP' }));

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toBe("We couldn't send your RSVP. Please try again.");
    expect(alert.classList.contains('alert')).toBe(true);
    expect(alert.querySelector('svg[aria-hidden="true"]')).not.toBeNull();
    expect(screen.queryByText('Please fix the highlighted fields.')).toBeNull();
  });

  test('REQ-84: Going / Not going is a radio group named "Your answer"', () => {
    renderWithIntl(<RsvpForm submit={vi.fn()} />);

    const group = screen.getByRole('radiogroup', { name: 'Your answer' });
    expect(within(group).getAllByRole('radio')).toHaveLength(2);
    expect((screen.getByLabelText('Going') as HTMLInputElement).checked).toBe(true);
  });

  test('REQ-84: the stepper changes the party size and disappears when Not going', () => {
    renderWithIntl(<RsvpForm submit={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'One more person' }));
    expect(
      (screen.getByLabelText('How many people, including you?') as HTMLInputElement).value,
    ).toBe('2');

    fireEvent.click(screen.getByLabelText('Not going'));
    expect(screen.queryByRole('button', { name: 'One more person' })).toBeNull();
  });

  test('REQ-137: an empty name focuses the name field and is described, not an alert', () => {
    renderWithIntl(<RsvpForm submit={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Send RSVP' }));

    const input = screen.getByLabelText('Your name');
    expect(document.activeElement).toBe(input);
    expect(input.getAttribute('aria-describedby')).toBe('rsvp-name-hint rsvp-name-error');
    expect(document.getElementById('rsvp-name-error')?.textContent).toBe('This field is required.');
    expect(screen.queryByRole('alert')).toBeNull();
  });

  test('REQ-137: a party size refused by the server focuses the party size', async () => {
    const submit = vi.fn().mockResolvedValue({
      ok: false,
      code: 'VALIDATION_ERROR',
      fieldErrors: { partySize: 'partySizeRange' },
    });
    renderWithIntl(<RsvpForm submit={submit} />);
    fireEvent.change(screen.getByLabelText('Your name'), { target: { value: 'Maria' } });

    fireEvent.click(screen.getByRole('button', { name: 'Send RSVP' }));

    await waitFor(() =>
      expect(document.activeElement).toBe(screen.getByLabelText('How many people, including you?')),
    );
  });

  test('REQ-84: the name hint is linked to the input', () => {
    const { container } = renderWithIntl(<RsvpForm submit={vi.fn()} />);

    expect(screen.getByLabelText('Your name').getAttribute('aria-describedby')).toBe(
      'rsvp-name-hint',
    );
    expect(container.querySelector('#rsvp-name-hint')?.textContent).toBe(
      'The organizer sees this name on the guest list.',
    );
  });

  test('REQ-78: every icon in the form is hidden from assistive technology', () => {
    const { container } = renderWithIntl(<RsvpForm submit={vi.fn()} />);

    const icons = container.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThan(0);
    expect(container.querySelectorAll('svg:not([aria-hidden="true"])')).toHaveLength(0);
  });
});
