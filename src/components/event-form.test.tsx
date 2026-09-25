// @vitest-environment jsdom
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { renderWithIntl } from '@/test/render';
import { detectBrowserTimeZone } from '@/lib/browser-timezone';
import type { ParseEventResult } from '@/lib/ai/types';
import { EventForm } from './event-form';

const nav = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn(), replace: vi.fn() }));
vi.mock('@/i18n/navigation', () => ({ useRouter: () => nav, usePathname: () => '/' }));
vi.mock('@/lib/browser-timezone', () => ({ detectBrowserTimeZone: vi.fn(() => 'UTC') }));

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

describe('EventForm groups, announced errors and saving state (REQ-83, REQ-69)', () => {
  test('REQ-83: fields are grouped under What, When and Where', () => {
    renderWithIntl(<EventForm submit={vi.fn()} />);

    expect(
      within(screen.getByRole('group', { name: 'When' })).getByLabelText('Date'),
    ).toBeTruthy();
    expect(
      within(screen.getByRole('group', { name: 'What' })).getByLabelText('Name'),
    ).toBeTruthy();
    expect(
      within(screen.getByRole('group', { name: 'Where' })).getByLabelText('Location (optional)'),
    ).toBeTruthy();
  });

  test('REQ-69: a required-field error is announced', async () => {
    renderWithIntl(<EventForm submit={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Pasta night' } });
    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2099-01-01' } });
    fireEvent.change(screen.getByLabelText('Time'), { target: { value: '10:00' } });

    fireEvent.click(screen.getByRole('button', { name: 'Save event' }));

    expect((await screen.findByRole('alert')).textContent).toBe('This field is required.');
    expect(screen.getByLabelText('Name').getAttribute('aria-describedby')).toBe('name-error');
  });

  test('REQ-83: while saving, Save event keeps its label and is busy', async () => {
    const submit = vi.fn(() => new Promise<never>(() => {}));
    renderWithIntl(<EventForm submit={submit} />);
    fillValidFields();

    fireEvent.click(screen.getByRole('button', { name: 'Save event' }));

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Save event' }).getAttribute('aria-busy')).toBe(
        'true',
      ),
    );
  });
});

describe('EventForm timezone (REQ-13)', () => {
  test('REQ-13: the timezone select starts with the browser timezone', () => {
    vi.mocked(detectBrowserTimeZone).mockReturnValueOnce('America/Sao_Paulo');
    renderWithIntl(<EventForm submit={vi.fn()} />);

    const select = screen.getByLabelText('Timezone') as HTMLSelectElement;
    expect(select.value).toBe('America/Sao_Paulo');
  });

  test('REQ-13: an initial timezone wins over the browser', () => {
    renderWithIntl(<EventForm submit={vi.fn()} initialValues={{ timezone: 'Europe/Paris' }} />);

    const select = screen.getByLabelText('Timezone') as HTMLSelectElement;
    expect(select.value).toBe('Europe/Paris');
  });

  test('REQ-13: the organizer can change the timezone', () => {
    renderWithIntl(<EventForm submit={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Timezone'), { target: { value: 'Europe/Paris' } });

    const select = screen.getByLabelText('Timezone') as HTMLSelectElement;
    expect(select.value).toBe('Europe/Paris');
  });
});

describe('EventForm — Fill with AI (REQ-51)', () => {
  const filled: ParseEventResult = {
    fields: {
      name: 'Team dinner',
      description: 'Dinner with the team.',
      date: '2026-10-02',
      time: '19:00',
      timezone: 'America/New_York',
      location: null,
    },
    missing: ['location'],
    timezoneFromText: true,
    notAnEvent: false,
  };

  function describeAndFill(container: HTMLElement) {
    fireEvent.change(screen.getByLabelText('Describe your event'), {
      target: { value: "Team dinner next Friday 7pm at Mario's" },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Fill with AI' }));
    return container;
  }

  test('REQ-51: Fill with AI puts the returned values in the form and flags the missing ones', async () => {
    const aiFill = vi.fn().mockResolvedValue({ ok: true, data: filled });
    const { container } = renderWithIntl(<EventForm submit={vi.fn()} aiFill={aiFill} />);

    describeAndFill(container);

    await waitFor(() => {
      expect((screen.getByLabelText('Name') as HTMLInputElement).value).toBe('Team dinner');
    });
    expect((screen.getByLabelText('Description') as HTMLTextAreaElement).value).toBe(
      'Dinner with the team.',
    );
    expect((screen.getByLabelText('Date') as HTMLInputElement).value).toBe('2026-10-02');
    expect((screen.getByLabelText('Time') as HTMLInputElement).value).toBe('19:00');
    expect((screen.getByLabelText('Timezone') as HTMLSelectElement).value).toBe('America/New_York');
    const location = screen.getByLabelText('Location (optional)') as HTMLInputElement;
    expect(location.value).toBe('');
    expect(location.getAttribute('aria-invalid')).toBe('true');
    expect(container.querySelector('#location-missing')?.textContent).toBe(
      'Not found in your text — please fill it.',
    );
    expect(container.querySelector('#name-missing')).toBeNull();
    expect(screen.getByLabelText('Name').getAttribute('aria-invalid')).toBeNull();
    expect(aiFill).toHaveBeenCalledWith("Team dinner next Friday 7pm at Mario's", 'UTC');
  });

  test('REQ-51: an AI failure shows the fallback message and keeps the typed values', async () => {
    const aiFill = vi.fn().mockResolvedValue({ ok: false, code: 'AI_UNAVAILABLE' });
    const { container } = renderWithIntl(<EventForm submit={vi.fn()} aiFill={aiFill} />);
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Old name' } });

    describeAndFill(container);

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toBe("Couldn't fill automatically — please fill the form.");
    expect((screen.getByLabelText('Name') as HTMLInputElement).value).toBe('Old name');
  });

  test('REQ-51: the daily limit message keeps the Fill with AI button visible', async () => {
    const aiFill = vi.fn().mockResolvedValue({ ok: false, code: 'AI_LIMIT_REACHED' });
    const { container } = renderWithIntl(<EventForm submit={vi.fn()} aiFill={aiFill} />);

    describeAndFill(container);

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toBe('Daily AI limit reached — fill the form manually.');
    expect(screen.getByRole('button', { name: 'Fill with AI' })).toBeTruthy();
  });

  test('REQ-51: filling does not submit the form', async () => {
    const submit = vi.fn();
    const aiFill = vi.fn().mockResolvedValue({ ok: true, data: filled });
    const { container } = renderWithIntl(<EventForm submit={submit} aiFill={aiFill} />);

    describeAndFill(container);

    await waitFor(() => {
      expect((screen.getByLabelText('Name') as HTMLInputElement).value).toBe('Team dinner');
    });
    expect(submit).not.toHaveBeenCalled();
    expect(nav.push).not.toHaveBeenCalled();
  });

  test('REQ-51: non-event text shows the not-found message and flags no field', async () => {
    const aiFill = vi.fn().mockResolvedValue({
      ok: true,
      data: {
        fields: {
          name: null,
          description: null,
          date: null,
          time: null,
          timezone: null,
          location: null,
        },
        missing: ['name', 'description', 'date', 'time', 'timezone', 'location'],
        timezoneFromText: false,
        notAnEvent: true,
      },
    });
    const { container } = renderWithIntl(<EventForm submit={vi.fn()} aiFill={aiFill} />);
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Old name' } });
    fireEvent.change(screen.getByLabelText('Describe your event'), {
      target: { value: "What's the weather like tomorrow?" },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Fill with AI' }));

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toBe("Couldn't find event details in that text.");
    expect((screen.getByLabelText('Name') as HTMLInputElement).value).toBe('Old name');
    expect(container.querySelectorAll('[aria-invalid="true"]').length).toBe(0);
    expect(screen.queryByText('Not found in your text — please fill it.')).toBeNull();
  });
});
