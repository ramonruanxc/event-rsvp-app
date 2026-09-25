// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { fireEvent } from '@testing-library/react';
import { renderWithIntl } from '@/test/render';
import { UserMenu } from './user-menu';

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

describe('UserMenu', () => {
  it('REQ-80: the summary is named "Account menu" and shows the initial', () => {
    const { getByLabelText } = renderWithIntl(
      <UserMenu name="Ana" initial="A" signOutAction={vi.fn()} />,
    );
    const summary = getByLabelText('Account menu');
    expect(summary.tagName).toBe('SUMMARY');
    expect(summary.textContent).toBe('A');
  });

  it('REQ-80: the menu offers My events and Sign out and closes after navigating', () => {
    const { getByText, container } = renderWithIntl(
      <UserMenu name="Ana" initial="A" signOutAction={vi.fn()} />,
    );
    expect(getByText('Signed in as Ana')).not.toBeNull();
    expect(getByText('My events').closest('a')?.getAttribute('href')).toBe('/dashboard');
    expect(getByText('Sign out').closest('button')?.getAttribute('type')).toBe('submit');

    const details = container.querySelector('details')!;
    details.open = true;
    fireEvent.click(getByText('My events'));
    expect(details.open).toBe(false);
  });

  it('REQ-80: without a name there is no "Signed in as" line', () => {
    const { queryByText } = renderWithIntl(
      <UserMenu name={null} initial="A" signOutAction={vi.fn()} />,
    );
    expect(queryByText(/Signed in as/)).toBeNull();
  });
});
