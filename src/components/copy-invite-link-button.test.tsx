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
    expect(screen.getByText('Link copied')).toBeInTheDocument();
  });
});
