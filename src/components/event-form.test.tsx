// @vitest-environment jsdom
import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { renderWithIntl } from '@/test/render';
import { EventForm } from './event-form';

const nav = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn(), replace: vi.fn() }));
vi.mock('@/i18n/navigation', () => ({ useRouter: () => nav, usePathname: () => '/' }));
vi.mock('@/lib/browser-timezone', () => ({ detectBrowserTimeZone: () => 'UTC' }));

/** Fills every field with values that pass client-side validation. */
function fillValidFields() {
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Team dinner' } });
  fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Pasta night' } });
  fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2099-01-01' } });
  fireEvent.change(screen.getByLabelText('Time'), { target: { value: '10:00' } });
}

describe('EventForm', () => {
  test('REQ-15: shows a required error and does not submit when the name is empty', async () => {
    const submit = vi.fn();
    renderWithIntl(<EventForm submit={submit} />);
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Pasta night' } });
    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2099-01-01' } });
    fireEvent.change(screen.getByLabelText('Time'), { target: { value: '10:00' } });

    fireEvent.click(screen.getByRole('button', { name: 'Save event' }));

    expect(await screen.findByText('This field is required.')).toBeTruthy();
    expect(submit).not.toHaveBeenCalled();
  });

  test('REQ-15: shows server field errors', async () => {
    const submit = vi.fn().mockResolvedValue({
      ok: false,
      code: 'VALIDATION_ERROR',
      fieldErrors: { date: 'inPast' },
    });
    renderWithIntl(<EventForm submit={submit} />);
    fillValidFields();

    fireEvent.click(screen.getByRole('button', { name: 'Save event' }));

    expect(await screen.findByText('The date and time cannot be in the past.')).toBeTruthy();
  });

  test('REQ-15: shows the translated message of any other error', async () => {
    const submit = vi.fn().mockResolvedValue({ ok: false, code: 'INTERNAL_ERROR' });
    renderWithIntl(<EventForm submit={submit} />);
    fillValidFields();

    fireEvent.click(screen.getByRole('button', { name: 'Save event' }));

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toBe('Something went wrong. Please try again.');
  });
});
