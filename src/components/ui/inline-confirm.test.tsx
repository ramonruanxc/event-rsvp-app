// @vitest-environment jsdom
import { fireEvent, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithIntl } from '@/test/render';
import { InlineConfirm } from './inline-confirm';

describe('InlineConfirm', () => {
  it('REQ-72: the trigger opens an inline group and nothing runs yet', () => {
    const onConfirm = vi.fn();
    const { getByRole, queryByRole } = renderWithIntl(
      <InlineConfirm
        triggerLabel="Delete event"
        question="Delete this event and all its RSVPs? This cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Keep"
        onConfirm={onConfirm}
      />,
    );
    fireEvent.click(getByRole('button', { name: 'Delete event' }));
    expect(
      getByRole('group', {
        name: 'Delete this event and all its RSVPs? This cannot be undone.',
      }),
    ).not.toBeNull();
    expect(queryByRole('dialog')).toBeNull();
    expect(queryByRole('button', { name: 'Delete event' })).toBeNull();
    expect(onConfirm).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(getByRole('button', { name: 'Keep' }));
  });

  it('REQ-72: Keep closes it and returns focus to the trigger', () => {
    const onConfirm = vi.fn();
    const { getByRole, queryByRole } = renderWithIntl(
      <InlineConfirm
        triggerLabel="Delete event"
        question="Delete this event and all its RSVPs? This cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Keep"
        onConfirm={onConfirm}
      />,
    );
    fireEvent.click(getByRole('button', { name: 'Delete event' }));
    fireEvent.click(getByRole('button', { name: 'Keep' }));
    expect(queryByRole('group')).toBeNull();
    expect(document.activeElement).toBe(getByRole('button', { name: 'Delete event' }));
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('REQ-67: Escape closes it and returns focus to the trigger', () => {
    const onConfirm = vi.fn();
    const { getByRole, queryByRole } = renderWithIntl(
      <InlineConfirm
        triggerLabel="Delete event"
        question="Delete this event and all its RSVPs? This cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Keep"
        onConfirm={onConfirm}
      />,
    );
    fireEvent.click(getByRole('button', { name: 'Delete event' }));
    fireEvent.keyDown(getByRole('button', { name: 'Keep' }), { key: 'Escape' });
    expect(queryByRole('group')).toBeNull();
    expect(document.activeElement).toBe(getByRole('button', { name: 'Delete event' }));
  });

  it('REQ-72: confirming runs the action once and marks the button busy', () => {
    const onConfirm = vi.fn(() => new Promise<void>(() => {}));
    const { getByRole } = renderWithIntl(
      <InlineConfirm
        triggerLabel="Delete event"
        question="Delete this event and all its RSVPs? This cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Keep"
        onConfirm={onConfirm}
      />,
    );
    fireEvent.click(getByRole('button', { name: 'Delete event' }));
    fireEvent.click(getByRole('button', { name: 'Delete' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(getByRole('button', { name: 'Delete' }).getAttribute('aria-busy')).toBe('true');
  });

  it('REQ-143: the row layout names the group with its question, shown as text on phones', () => {
    const { getByRole, getByText } = renderWithIntl(
      <InlineConfirm
        layout="row"
        triggerLabel="Remove"
        triggerAriaLabel="Remove Maria"
        question="Remove Maria from the guest list?"
        confirmLabel="Remove"
        cancelLabel="Keep"
        onConfirm={vi.fn()}
      />,
    );
    fireEvent.click(getByRole('button', { name: 'Remove Maria' }));
    expect(getByRole('group', { name: 'Remove Maria from the guest list?' })).not.toBeNull();
    expect(getByText('Remove Maria from the guest list?').className).toBe('inline-confirm-q small');
  });

  it('REQ-142: an error shows as an alert inside the group, in both layouts', () => {
    for (const layout of ['block', 'row'] as const) {
      const { getByRole, unmount } = renderWithIntl(
        <InlineConfirm
          layout={layout}
          triggerLabel="Remove"
          question="Remove Maria from the guest list?"
          confirmLabel="Remove"
          cancelLabel="Keep"
          onConfirm={vi.fn()}
          error="Something went wrong. Please try again."
        />,
      );
      fireEvent.click(getByRole('button', { name: 'Remove' }));
      expect(within(getByRole('group')).getByRole('alert').textContent, layout).toBe(
        'Something went wrong. Please try again.',
      );
      unmount();
    }
  });
});
