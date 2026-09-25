// @vitest-environment jsdom
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { buildInviteUrl } from '@/lib/invite-url';
import { renderWithIntl } from '@/test/render';
import { CopyInviteLinkButton } from './copy-invite-link-button';

describe('CopyInviteLinkButton', () => {
  test('REQ-38: copying writes the invite URL and confirms', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    renderWithIntl(<CopyInviteLinkButton slug="abc" />);
    fireEvent.click(screen.getByRole('button', { name: 'Copy invite link' }));

    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith(buildInviteUrl(window.location.origin, 'abc')),
    );
    expect(screen.getByText('Link copied')).toBeTruthy();
  });

  test('REQ-79: the confirmation is announced in a polite live region', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    const { container } = renderWithIntl(<CopyInviteLinkButton slug="abc" />);

    fireEvent.click(screen.getByRole('button', { name: 'Copy invite link' }));

    await waitFor(() =>
      expect(container.querySelector('[aria-live="polite"]')?.textContent).toBe('Link copied'),
    );
  });

  test('REQ-85: the invite link is shown in a read-only field labelled "Invite link"', async () => {
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
    renderWithIntl(<CopyInviteLinkButton slug="abc" />);

    await waitFor(() =>
      expect((screen.getByLabelText('Invite link') as HTMLInputElement).value).toBe(
        buildInviteUrl(window.location.origin, 'abc'),
      ),
    );
    expect((screen.getByLabelText('Invite link') as HTMLInputElement).readOnly).toBe(true);
  });

  test('REQ-70: after copying the button reads "Copied" with a check, then returns', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    const { container } = renderWithIntl(<CopyInviteLinkButton slug="abc" copiedMs={50} />);

    fireEvent.click(screen.getByRole('button', { name: 'Copy invite link' }));

    const copiedButton = await screen.findByRole('button', { name: 'Copied' });
    expect(copiedButton.querySelector('svg.lucide-check')).not.toBeNull();

    await waitFor(() => screen.getByRole('button', { name: 'Copy invite link' }));
    expect(container.querySelector('[aria-live="polite"]')?.textContent).toBe('');
  });
});
