// @vitest-environment jsdom
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
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

    expect(within(screen.getByRole('group', { name: 'When' })).getByLabelText('Date')).toBeTruthy();
    expect(within(screen.getByRole('group', { name: 'What' })).getByLabelText('Name')).toBeTruthy();
    expect(
      within(screen.getByRole('group', { name: 'Where' })).getByLabelText('Location (optional)'),
    ).toBeTruthy();
  });

  test('REQ-137: an empty name focuses Name, with the error described and no alert', () => {
    renderWithIntl(<EventForm submit={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Pasta night' } });
    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2099-01-01' } });
    fireEvent.change(screen.getByLabelText('Time'), { target: { value: '10:00' } });

    fireEvent.click(screen.getByRole('button', { name: 'Save event' }));

    const name = screen.getByLabelText('Name');
    expect(document.activeElement).toBe(name);
    expect(name.getAttribute('aria-describedby')).toBe('name-error');
    expect(document.getElementById('name-error')?.textContent).toBe('This field is required.');
    expect(screen.queryByRole('alert')).toBeNull();
  });

  test('REQ-137: a date refused by the server focuses Date', async () => {
    const submit = vi.fn().mockResolvedValue({
      ok: false,
      code: 'VALIDATION_ERROR',
      fieldErrors: { date: 'inPast' },
    });
    renderWithIntl(<EventForm submit={submit} />);
    fillValidFields();

    fireEvent.click(screen.getByRole('button', { name: 'Save event' }));

    await waitFor(() => expect(document.activeElement).toBe(screen.getByLabelText('Date')));
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

  test('REQ-83: a successful fill reports how many fields were filled', async () => {
    const aiFill = vi.fn().mockResolvedValue({ ok: true, data: filled });
    const { container } = renderWithIntl(<EventForm submit={vi.fn()} aiFill={aiFill} />);

    describeAndFill(container);

    await waitFor(() =>
      expect(screen.getByRole('status').textContent).toBe('Filled 5 fields · check them below'),
    );
  });

  test('REQ-70: a missing field shows "Needed" next to its label', async () => {
    const aiFill = vi.fn().mockResolvedValue({ ok: true, data: filled });
    const { container } = renderWithIntl(<EventForm submit={vi.fn()} aiFill={aiFill} />);

    describeAndFill(container);

    await waitFor(() => expect(screen.getAllByText('Needed')).toHaveLength(1));
    expect(container.querySelector('.field.is-missing #location')).not.toBeNull();
  });

  test('REQ-83: while filling, Fill with AI keeps its label and is busy', async () => {
    const aiFill = vi.fn(() => new Promise<never>(() => {}));
    const { container } = renderWithIntl(<EventForm submit={vi.fn()} aiFill={aiFill} />);

    describeAndFill(container);

    await waitFor(() => {
      const button = screen.getByRole('button', { name: 'Fill with AI' }) as HTMLButtonElement;
      expect(button.getAttribute('aria-busy')).toBe('true');
      expect(button.getAttribute('aria-disabled')).toBe('true');
    });
    expect(screen.getByRole('status').textContent).toBe('Filling…');
  });

  test('REQ-51: an AI failure shows the fallback message and keeps the typed values', async () => {
    const aiFill = vi.fn().mockResolvedValue({ ok: false, code: 'AI_UNAVAILABLE' });
    const { container } = renderWithIntl(<EventForm submit={vi.fn()} aiFill={aiFill} />);
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Old name' } });

    describeAndFill(container);

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toBe(
      'The AI service is unavailable right now — try again later, or fill the form below.',
    );
    expect((screen.getByLabelText('Name') as HTMLInputElement).value).toBe('Old name');
  });

  test('REQ-132: each AI failure shows its own message and keeps Fill with AI', async () => {
    const cases: [string, string][] = [
      ['AI_NOT_CONFIGURED', "AI fill isn't set up on this server — fill the form below."],
      ['AI_TIMEOUT', 'The AI took too long to answer — try again, or fill the form below.'],
      [
        'AI_UNAVAILABLE',
        'The AI service is unavailable right now — try again later, or fill the form below.',
      ],
    ];
    for (const [code, message] of cases) {
      const aiFill = vi.fn().mockResolvedValue({ ok: false, code });
      const { container, unmount } = renderWithIntl(<EventForm submit={vi.fn()} aiFill={aiFill} />);
      describeAndFill(container);

      expect((await screen.findByRole('alert')).textContent).toBe(message);
      expect(screen.getByRole('button', { name: 'Fill with AI' })).toBeTruthy();
      unmount();
    }
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

describe('EventForm date and time pickers (REQ-131)', () => {
  /** Installs a mock `showPicker` on every input (jsdom has none) and returns it. */
  function mockShowPicker(impl: () => void = () => {}) {
    const showPicker = vi.fn(impl);
    Object.defineProperty(HTMLInputElement.prototype, 'showPicker', {
      configurable: true,
      writable: true,
      value: showPicker,
    });
    return showPicker;
  }

  afterEach(() => {
    Reflect.deleteProperty(HTMLInputElement.prototype, 'showPicker');
  });

  test('REQ-131: clicking the date field opens its picker', () => {
    const showPicker = mockShowPicker();
    renderWithIntl(<EventForm submit={vi.fn()} />);
    const dateInput = screen.getByLabelText('Date');

    fireEvent.click(dateInput);

    expect(showPicker).toHaveBeenCalledTimes(1);
    expect(showPicker.mock.contexts[0]).toBe(dateInput);
  });

  test('REQ-131: clicking the time field opens its picker', () => {
    const showPicker = mockShowPicker();
    renderWithIntl(<EventForm submit={vi.fn()} />);
    const timeInput = screen.getByLabelText('Time');

    fireEvent.click(timeInput);

    expect(showPicker).toHaveBeenCalledTimes(1);
    expect(showPicker.mock.contexts[0]).toBe(timeInput);
  });

  test('REQ-131: the calendar button focuses the date field and opens its picker', () => {
    const showPicker = mockShowPicker();
    renderWithIntl(<EventForm submit={vi.fn()} />);
    const dateInput = screen.getByLabelText('Date');

    fireEvent.click(screen.getByRole('button', { name: 'Open calendar' }));

    expect(document.activeElement).toBe(dateInput);
    expect(showPicker).toHaveBeenCalledTimes(1);
    expect(showPicker.mock.contexts[0]).toBe(dateInput);
  });

  test('REQ-131: the clock button focuses the time field and opens its picker', () => {
    const showPicker = mockShowPicker();
    renderWithIntl(<EventForm submit={vi.fn()} />);
    const timeInput = screen.getByLabelText('Time');

    fireEvent.click(screen.getByRole('button', { name: 'Open time picker' }));

    expect(document.activeElement).toBe(timeInput);
    expect(showPicker).toHaveBeenCalledTimes(1);
    expect(showPicker.mock.contexts[0]).toBe(timeInput);
  });

  test('REQ-131: a showPicker that throws breaks nothing', () => {
    const showPicker = mockShowPicker(() => {
      throw new DOMException('The picker is already open.', 'InvalidStateError');
    });
    renderWithIntl(<EventForm submit={vi.fn()} />);
    const dateInput = screen.getByLabelText('Date') as HTMLInputElement;

    fireEvent.click(dateInput);
    fireEvent.click(screen.getByRole('button', { name: 'Open calendar' }));
    fireEvent.change(dateInput, { target: { value: '2099-01-01' } });

    expect(showPicker).toHaveBeenCalledTimes(2);
    expect(document.activeElement).toBe(dateInput);
    expect(dateInput.value).toBe('2099-01-01');
  });

  test('REQ-131: without showPicker the button still focuses its field', () => {
    renderWithIntl(<EventForm submit={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Open time picker' }));

    expect(document.activeElement).toBe(screen.getByLabelText('Time'));
  });

  test('REQ-131: both picker buttons are translated plain buttons in the When group', () => {
    renderWithIntl(<EventForm submit={vi.fn()} />);
    const when = within(screen.getByRole('group', { name: 'When' }));
    const calendar = when.getByRole('button', { name: 'Open calendar' });
    const clock = when.getByRole('button', { name: 'Open time picker' });

    expect(calendar.getAttribute('type')).toBe('button');
    expect(clock.getAttribute('type')).toBe('button');
    expect(when.getAllByRole('button')).toHaveLength(2);
  });
});
