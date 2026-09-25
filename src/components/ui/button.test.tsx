// @vitest-environment jsdom
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
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
  it('REQ-71: a loading button keeps its label, is disabled and busy', () => {
    const { getByRole } = renderWithIntl(<Button loading>Save event</Button>);
    const button = getByRole('button', { name: 'Save event' });
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect((button as HTMLButtonElement).disabled).toBe(true);
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
