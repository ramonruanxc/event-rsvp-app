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

  it('REQ-128: the menu links to Account between My events and Sign out', () => {
    const { getByText, container } = renderWithIntl(
      <UserMenu name="Ana" initial="A" signOutAction={vi.fn()} />,
    );
    expect(getByText('Account').closest('a')?.getAttribute('href')).toBe('/account');
    const items = [...container.querySelectorAll('.menu-pop a, .menu-pop button')].map(
      (el) => el.textContent,
    );
    expect(items).toEqual(['My events', 'Account', 'Sign out']);
  });
});

describe('UserMenu closing (REQ-145)', () => {
  function openMenu() {
    const view = renderWithIntl(<UserMenu name="Ana" initial="A" signOutAction={vi.fn()} />);
    const details = view.container.querySelector('details')!;
    details.open = true;
    return { ...view, details };
  }

  it('REQ-145: Escape closes the menu and puts focus on its summary', () => {
    const { details, getByText, getByLabelText } = openMenu();
    getByText('My events').focus();

    fireEvent.keyDown(getByText('My events'), { key: 'Escape' });

    expect(details.open).toBe(false);
    expect(document.activeElement).toBe(getByLabelText('Account menu'));
  });

  it('REQ-145: focus moving outside the menu closes it; moving inside keeps it open', () => {
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    const { details, getByText } = openMenu();

    fireEvent.focusOut(getByText('My events'), { relatedTarget: getByText('Account') });
    expect(details.open).toBe(true);

    fireEvent.focusOut(getByText('Sign out'), { relatedTarget: outside });
    expect(details.open).toBe(false);
    outside.remove();
  });

  it('REQ-145: a pointer press outside closes the menu; one inside does not', () => {
    const { details, getByText } = openMenu();

    fireEvent.pointerDown(getByText('Signed in as Ana'));
    expect(details.open).toBe(true);

    fireEvent.pointerDown(document.body);
    expect(details.open).toBe(false);
  });
});
