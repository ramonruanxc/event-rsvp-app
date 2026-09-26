// @vitest-environment jsdom
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent } from '@testing-library/react';
import { renderWithIntl } from '@/test/render';
import { Button, buttonClass } from './button';

describe('buttonClass', () => {
  it('REQ-71: buttonClass maps variant and size to the design classes', () => {
    expect(buttonClass()).toBe('btn btn-secondary');
    expect(buttonClass('primary', 'lg')).toBe('btn btn-primary btn-lg');
    expect(buttonClass('ghost-danger', 'sm', 'x')).toBe('btn btn-ghost-danger btn-sm x');
    expect(buttonClass('danger')).toBe('btn btn-danger');
  });
});

describe('Button', () => {
  it('REQ-71: a loading button keeps its label, is busy and shows a spinner', () => {
    const { getByRole } = renderWithIntl(<Button loading>Save event</Button>);
    const button = getByRole('button', { name: 'Save event' });
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(button.getAttribute('type')).toBe('button');
    expect(button.querySelector('.spinner[aria-hidden="true"]')).not.toBeNull();
  });

  it('REQ-71: Button passes type, aria-label and ref through', () => {
    const ref = createRef<HTMLButtonElement>();
    const { getByRole } = renderWithIntl(
      <Button ref={ref} type="submit" aria-label="Go">
        x
      </Button>,
    );
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    expect(ref.current?.getAttribute('type')).toBe('submit');
    expect(getByRole('button', { name: 'Go' })).toBe(ref.current);
  });
});

describe('Button while loading (REQ-136)', () => {
  it('REQ-136: a loading button stays focusable, is aria-disabled and ignores clicks', () => {
    const onClick = vi.fn();
    const { getByRole } = renderWithIntl(
      <Button loading onClick={onClick}>
        Save event
      </Button>,
    );
    const button = getByRole('button', { name: 'Save event' }) as HTMLButtonElement;
    button.focus();

    fireEvent.click(button);

    expect(button.disabled).toBe(false);
    expect(button.getAttribute('aria-disabled')).toBe('true');
    expect(onClick).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(button);
  });

  it('REQ-136: a loading submit button does not submit its form', () => {
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
    const { getByRole } = renderWithIntl(
      <form onSubmit={onSubmit}>
        <Button type="submit" loading>
          Send RSVP
        </Button>
      </form>,
    );

    fireEvent.click(getByRole('button', { name: 'Send RSVP' }));

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('REQ-136: an idle button passes clicks through; disabled still disables', () => {
    const onClick = vi.fn();
    const { getByRole } = renderWithIntl(
      <>
        <Button onClick={onClick}>Change</Button>
        <Button disabled>Keep</Button>
      </>,
    );

    fireEvent.click(getByRole('button', { name: 'Change' }));

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(getByRole('button', { name: 'Change' }).getAttribute('aria-disabled')).toBeNull();
    expect((getByRole('button', { name: 'Keep' }) as HTMLButtonElement).disabled).toBe(true);
  });
});
