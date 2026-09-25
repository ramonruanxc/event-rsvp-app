// @vitest-environment jsdom
import { fireEvent } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { renderWithIntl } from '@/test/render';
import { Stepper } from './stepper';

function Harness({ initial }: { initial: number }) {
  const [value, setValue] = useState(initial);
  return (
    <>
      <label htmlFor="ps">People</label>
      <Stepper
        id="ps"
        value={value}
        min={1}
        max={10}
        onChange={setValue}
        decreaseLabel="One less person"
        increaseLabel="One more person"
      />
    </>
  );
}

describe('Stepper', () => {
  it('REQ-84: the buttons change the value by one', () => {
    const { getByLabelText, getByRole } = renderWithIntl(<Harness initial={3} />);
    fireEvent.click(getByRole('button', { name: 'One more person' }));
    expect((getByLabelText('People') as HTMLInputElement).value).toBe('4');
    fireEvent.click(getByRole('button', { name: 'One less person' }));
    fireEvent.click(getByRole('button', { name: 'One less person' }));
    expect((getByLabelText('People') as HTMLInputElement).value).toBe('2');
  });

  it('REQ-84: the buttons are disabled at the bounds', () => {
    const { getByRole, rerender } = renderWithIntl(<Harness initial={1} />);
    expect((getByRole('button', { name: 'One less person' }) as HTMLButtonElement).disabled).toBe(
      true,
    );
    expect((getByRole('button', { name: 'One more person' }) as HTMLButtonElement).disabled).toBe(
      false,
    );
    rerender(<Harness initial={10} />);
    expect((getByRole('button', { name: 'One more person' }) as HTMLButtonElement).disabled).toBe(
      true,
    );
  });

  it('REQ-71: both buttons have accessible names and hidden icons', () => {
    const { getByRole, container } = renderWithIntl(<Harness initial={3} />);
    expect(getByRole('button', { name: 'One less person' })).not.toBeNull();
    expect(getByRole('button', { name: 'One more person' })).not.toBeNull();
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
    svgs.forEach((svg) => expect(svg.getAttribute('aria-hidden')).toBe('true'));
  });
});
