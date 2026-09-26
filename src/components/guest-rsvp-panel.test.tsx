// @vitest-environment jsdom
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { renderWithIntl } from '@/test/render';
import { GuestRsvpPanel } from './guest-rsvp-panel';

const nav = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn(), replace: vi.fn() }));
vi.mock('@/i18n/navigation', () => ({ useRouter: () => nav, usePathname: () => '/' }));

describe('GuestRsvpPanel', () => {
  test('REQ-31: a returning guest who is going sees "You\'re going · 3 people" with Change and I can\'t go', () => {
    renderWithIntl(
      <GuestRsvpPanel
        ownRsvp={{ name: 'Maria', status: 'GOING', partySize: 3 }}
        ended={false}
        submit={vi.fn()}
        cancel={vi.fn()}
      />,
    );

    expect(screen.getByText("You're going · 3 people")).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Change' })).toBeTruthy();
    expect(screen.getByRole('button', { name: "I can't go" })).toBeTruthy();
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
    expect(screen.queryByRole('button', { name: "I can't go" })).toBeNull();
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

  test("REQ-141: I can't go calls the cancel action", async () => {
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

    fireEvent.click(screen.getByRole('button', { name: "I can't go" }));

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
    expect(screen.getByText("You're going · 3 people")).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Change' })).toBeNull();
    expect(screen.queryByRole('button', { name: "I can't go" })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Send RSVP' })).toBeNull();
  });

  test('REQ-84: a going guest sees the confirmation panel with a check badge and "Saved as Maria"', () => {
    const { container } = renderWithIntl(
      <GuestRsvpPanel
        ownRsvp={{ name: 'Maria', status: 'GOING', partySize: 3 }}
        ended={false}
        submit={vi.fn()}
        cancel={vi.fn()}
      />,
    );

    const heading = screen.getByRole('heading', { level: 2, name: "You're going · 3 people" });
    expect(heading).toBeTruthy();
    expect(
      screen.getByText(
        'Saved as Maria. You can change your answer from this browser until the event starts.',
      ),
    ).toBeTruthy();
    expect(container.querySelector('.check-badge svg')?.getAttribute('aria-hidden')).toBe('true');
    expect(screen.getByRole('status').contains(heading)).toBe(true);
    expect(screen.getByRole('button', { name: "I can't go" })).toBeTruthy();
  });

  test('REQ-84: a party of one reads "You\'re going · 1 person"', () => {
    renderWithIntl(
      <GuestRsvpPanel
        ownRsvp={{ name: 'Kim', status: 'GOING', partySize: 1 }}
        ended={false}
        submit={vi.fn()}
        cancel={vi.fn()}
      />,
    );

    expect(screen.getByRole('heading', { level: 2, name: "You're going · 1 person" })).toBeTruthy();
  });

  test('REQ-70: the ended notice shows a clock icon, the closed-replies line and the own answer with an icon', () => {
    const { container } = renderWithIntl(
      <GuestRsvpPanel
        ownRsvp={{ name: 'Maria', status: 'GOING', partySize: 3 }}
        ended={true}
        submit={vi.fn()}
        cancel={vi.fn()}
      />,
    );

    expect(container.querySelector('.notice svg.lucide-clock')).not.toBeNull();
    expect(
      screen.getByText('Replies are closed, so answers can no longer be sent or changed.'),
    ).toBeTruthy();
    expect(container.querySelector('.answer-line svg.lucide-check')).not.toBeNull();
  });

  test('REQ-78: every icon in the panel is hidden from assistive technology', () => {
    const { container } = renderWithIntl(
      <GuestRsvpPanel
        ownRsvp={{ name: 'Maria', status: 'GOING', partySize: 3 }}
        ended={false}
        submit={vi.fn()}
        cancel={vi.fn()}
      />,
    );

    const icons = container.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThan(0);
    expect(container.querySelectorAll('svg:not([aria-hidden="true"])')).toHaveLength(0);
  });
});

describe('GuestRsvpPanel focus and Keep my answer (REQ-140, REQ-139, REQ-138)', () => {
  test('REQ-140: after a first RSVP the confirmation heading has focus', async () => {
    const submit = vi.fn().mockResolvedValue({
      ok: true,
      data: { name: 'Maria', status: 'GOING', partySize: 3 },
    });
    renderWithIntl(
      <GuestRsvpPanel ownRsvp={null} ended={false} submit={submit} cancel={vi.fn()} />,
    );
    fireEvent.change(screen.getByLabelText('Your name'), { target: { value: 'Maria' } });
    fireEvent.change(screen.getByLabelText('How many people, including you?'), {
      target: { value: '3' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Send RSVP' }));

    const heading = await screen.findByRole('heading', { name: "You're going · 3 people" });
    await waitFor(() => expect(document.activeElement).toBe(heading));
    expect(heading.getAttribute('tabindex')).toBe('-1');
  });

  test('REQ-140: Change focuses the name field', async () => {
    renderWithIntl(
      <GuestRsvpPanel
        ownRsvp={{ name: 'Maria', status: 'GOING', partySize: 3 }}
        ended={false}
        submit={vi.fn()}
        cancel={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Change' }));

    await waitFor(() => expect(document.activeElement).toBe(screen.getByLabelText('Your name')));
  });

  test("REQ-140: I can't go shows You're not going at once and focuses it", async () => {
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

    fireEvent.click(screen.getByRole('button', { name: "I can't go" }));

    const heading = await screen.findByRole('heading', { name: "You're not going" });
    await waitFor(() => expect(document.activeElement).toBe(heading));
    expect(nav.refresh).toHaveBeenCalled();
  });

  test('REQ-139: Keep my answer leaves the answer unchanged and focuses Change', async () => {
    const submit = vi.fn();
    renderWithIntl(
      <GuestRsvpPanel
        ownRsvp={{ name: 'Maria', status: 'GOING', partySize: 3 }}
        ended={false}
        submit={submit}
        cancel={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Change' }));
    fireEvent.change(screen.getByLabelText('Your name'), { target: { value: 'Mario' } });

    fireEvent.click(screen.getByRole('button', { name: 'Keep my answer' }));

    expect(screen.getByRole('heading', { name: "You're going · 3 people" })).toBeTruthy();
    await waitFor(() =>
      expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Change' })),
    );
    expect(submit).not.toHaveBeenCalled();
  });

  test('REQ-139: a first RSVP has no Keep my answer button', () => {
    renderWithIntl(
      <GuestRsvpPanel ownRsvp={null} ended={false} submit={vi.fn()} cancel={vi.fn()} />,
    );

    expect(screen.queryByRole('button', { name: 'Keep my answer' })).toBeNull();
  });

  test('REQ-138: Not going, then Change and Going, sends a party of one and shows it', async () => {
    const submit = vi.fn().mockResolvedValue({
      ok: true,
      data: { name: 'Maria', status: 'GOING', partySize: 1 },
    });
    renderWithIntl(
      <GuestRsvpPanel
        ownRsvp={{ name: 'Maria', status: 'NOT_GOING', partySize: 0 }}
        ended={false}
        submit={submit}
        cancel={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Change' }));
    fireEvent.click(screen.getByLabelText('Going'));

    fireEvent.click(screen.getByRole('button', { name: 'Send RSVP' }));

    await waitFor(() =>
      expect(submit).toHaveBeenCalledWith({ name: 'Maria', status: 'GOING', partySize: 1 }, ''),
    );
    expect(await screen.findByRole('heading', { name: "You're going · 1 person" })).toBeTruthy();
  });
});
